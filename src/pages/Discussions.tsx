import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Users, UserCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { useChatStore } from '../stores/chatStore';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChatGroup, DirectChat } from '../types';
import { useAuthStore } from '../stores/authStore';

const Discussions: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { groups, directChats, getUser, getOtherParticipant } = useChatStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredDirectChats = directChats.filter(chat => {
    if (!user) return false;
    const otherUser = getOtherParticipant(chat.id, user.id);
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: dateLocale });
  };
  
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return formatTime(date);
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return t('common.yesterday');
    }
    
    return format(date, 'dd MMM', { locale: dateLocale });
  };
  
  const handleGroupClick = (group: ChatGroup) => {
    navigate(`/discussions/${group.id}`);
  };
  
  const handleDirectChatClick = (chat: DirectChat) => {
    navigate(`/discussions/${chat.id}`);
  };

  return (
    <Layout title={t('discussions.title')}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-20">
        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('discussions.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'groups' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('groups')}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={18} />
              <span>{t('discussions.groups')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'direct' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('direct')}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCircle size={18} />
              <span>{t('discussions.directMessages')}</span>
            </div>
          </button>
        </div>
        
        {/* Content */}
        <div className="divide-y">
          {activeTab === 'groups' ? (
            filteredGroups.length > 0 ? (
              filteredGroups.map(group => (
                <button
                  key={group.id}
                  className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => handleGroupClick(group)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3 flex-shrink-0">
                    {group.imageUrl ? (
                      <img 
                        src={group.imageUrl} 
                        alt={group.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users size={24} className="text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h3 className="font-medium truncate">{group.name}</h3>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(group.lastActivity)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm truncate">{group.description}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? t('common.noResults') : t('discussions.noGroups')}
              </div>
            )
          ) : (
            filteredDirectChats.length > 0 ? (
              filteredDirectChats.map(chat => {
                if (!user) return null;
                const otherUser = getOtherParticipant(chat.id, user.id);
                if (!otherUser) return null;
                
                return (
                  <button
                    key={chat.id}
                    className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => handleDirectChatClick(chat)}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                      {otherUser.avatar ? (
                        <img 
                          src={otherUser.avatar} 
                          alt={otherUser.name} 
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        <UserCircle size={24} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-medium truncate">{otherUser.name}</h3>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(chat.lastActivity)}
                        </span>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600 text-sm truncate">
                            {t('discussions.newMessages')}
                          </p>
                          <span className="bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? t('common.noResults') : t('discussions.noDirectMessages')}
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Discussions;