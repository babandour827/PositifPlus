import { HfInference } from 'npm:@huggingface/inference@2.6.4';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { parse } from 'npm:pdf-parse@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface RequestPayload {
  prompt: string;
  conversationId?: string;
  documentId?: string;
  context?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const hf = new HfInference(Deno.env.get('HUGGINGFACE_API_KEY'));
    const { prompt, conversationId, documentId, context }: RequestPayload = await req.json();

    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Context: ${context}\n\nQuestion: ${prompt}`;
    }

    // Generate response using BioGPT
    const response = await hf.textGeneration({
      model: 'microsoft/biogpt',
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.7,
        top_p: 0.95,
        do_sample: true,
        return_full_text: false
      }
    });

    // Store the interaction in the database
    if (conversationId) {
      await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: prompt,
          },
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: response.generated_text,
          },
        ]);
    }

    // If there's a document to analyze
    if (documentId) {
      const { data: document } = await supabase
        .storage
        .from('documents')
        .download(documentId);

      if (document) {
        const pdfData = await parse(await document.arrayBuffer());
        
        // Generate summary using BioGPT
        const summary = await hf.textGeneration({
          model: 'microsoft/biogpt',
          inputs: `Summarize the following medical text:\n\n${pdfData.text.substring(0, 1000)}`,
          parameters: {
            max_new_tokens: 256,
            temperature: 0.3,
            return_full_text: false
          }
        });

        // Update document with summary
        await supabase
          .from('documents')
          .update({ summary: summary.generated_text })
          .eq('id', documentId);
      }
    }

    return new Response(
      JSON.stringify({
        content: response.generated_text,
        references: [] // In a production environment, we would extract references from the response
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});