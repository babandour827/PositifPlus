import React from 'react';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isUser, 
  timestamp,
  isLoading 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3 max-w-[90%]`}>
        <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white border border-gray-200 rounded-tl-none shadow-sm'
          }`}>
            {isLoading ? (
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{message}</p>
            )}
          </div>
          <span className={`text-xs mt-1 ${
            isUser ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;