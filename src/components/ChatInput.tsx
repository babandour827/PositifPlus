import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled 
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Décrivez vos symptômes ou posez votre question médicale..."
            className="w-full min-h-[60px] max-h-[120px] resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white h-[60px] px-4 rounded-md flex items-center justify-center"
        >
          ➤
        </button>
      </form>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
      </p>
    </div>
  );
};

export default ChatInput;