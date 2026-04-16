import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send, Paperclip, Mic, User } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const ChatRoom: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    sendMessage, 
    getUser, 
    getChatName, 
    getChatAvatar, 
    isLoading 
  } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const chatMessages = groupId ? messages[groupId] || [] : [];
  const chatName = groupId ? getChatName(groupId) : '';
  const chatAvatar = groupId ? getChatAvatar(groupId) : undefined;
  
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (groupId && newMessage.trim()) {
      sendMessage(groupId, newMessage);
      setNewMessage('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatMessageTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: dateLocale });
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would handle actual audio recording
  };
  
  const goBack = () => {
    navigate('/discussions');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4 flex items-center">
        <button 
          onClick={goBack}
          className="mr-3"
          aria-label={t('common.back')}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 mr-3">
          {chatAvatar ? (
            <img 
              src={chatAvatar} 
              alt={chatName} 
              className="h-10 w-10 rounded-full object-cover" 
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={20} className="text-primary-600" />
            </div>
          )}
        </div>
        
        <div>
          <h1 className="font-semibold">{chatName}</h1>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length > 0 ? (
          chatMessages.map((message) => {
            const sender = getUser(message.senderId);
            const isCurrentUser = message.senderId === '1'; // Assuming current user is '1'
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 overflow-hidden">
                    {sender?.avatar ? (
                      <img 
                        src={sender.avatar} 
                        alt={sender.name} 
                        className="h-8 w-8 object-cover" 
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[75%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
                  {!isCurrentUser && (
                    <p className="text-xs text-gray-600 mb-1">{sender?.name}</p>
                  )}
                  
                  <div 
                    className={`p-3 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-primary-500 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {message.isAudio ? (
                      <div className="flex items-center">
                        <Mic size={16} className="mr-2" />
                        <span>{t('chat.audioMessage')}</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-100' : 'text-gray-500'}`}>
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              {t('chat.noMessages')}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="bg-white border-t p-3">
        <div className="flex items-center">
          <button 
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
            aria-label={t('chat.attachFile')}
          >
            <Paperclip size={20} />
          </button>
          
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t('chat.messagePlaceholder')}
            className="flex-1 border rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary-500 mx-2 resize-none"
            rows={1}
          />
          
          {newMessage.trim() ? (
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className={`p-2 bg-primary-500 text-white rounded-full ${isLoading ? 'opacity-50' : 'hover:bg-primary-600'}`}
              aria-label={t('chat.sendMessage')}
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-full ${isRecording ? 'bg-error-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label={t('chat.recordAudio')}
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;