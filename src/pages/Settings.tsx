import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { useAuthStore } from '../stores/authStore';
import LanguageSelector from '../components/LanguageSelector';
import { Bell, Eye, User, Lock } from 'lucide-react';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'account' | 'accessibility' | 'notifications'>('account');
  
  if (!user) return null;
  
  const handleFontSizeChange = (size: 'normal' | 'large' | 'x-large') => {
    updateUser({
      accessibilitySettings: {
        ...user.accessibilitySettings,
        fontSize: size
      }
    });
  };
  
  const handleHighContrastChange = (enabled: boolean) => {
    updateUser({
      accessibilitySettings: {
        ...user.accessibilitySettings,
        highContrast: enabled
      }
    });
  };
  
  const handleScreenReaderChange = (enabled: boolean) => {
    updateUser({
      accessibilitySettings: {
        ...user.accessibilitySettings,
        screenReader: enabled
      }
    });
  };
  
  const handleNotificationChange = (key: keyof typeof user.notificationSettings, value: boolean) => {
    updateUser({
      notificationSettings: {
        ...user.notificationSettings,
        [key]: value
      }
    });
  };

  return (
    <Layout title={t('settings.title')}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-20">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'account' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('account')}
          >
            <div className="flex items-center justify-center gap-2">
              <User size={18} />
              <span>{t('settings.account')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'accessibility' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('accessibility')}
          >
            <div className="flex items-center justify-center gap-2">
              <Eye size={18} />
              <span>{t('settings.accessibility.title')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'notifications' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell size={18} />
              <span>{t('settings.notifications')}</span>
            </div>
          </button>
        </div>
        
        <div className="p-6">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.profile')}</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('common.name')}
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={user.name}
                      onChange={(e) => updateUser({ name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('welcome.email')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.language')}</h3>
                <LanguageSelector buttonSize="medium" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.security')}</h3>
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Lock size={18} />
                  <span>{t('settings.changePassword')}</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Accessibility Settings */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.accessibility.fontSize')}</h3>
                <div className="flex space-x-3">
                  {['normal', 'large', 'x-large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => handleFontSizeChange(size as any)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        user.accessibilitySettings.fontSize === size
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {t(`settings.accessibility.${size}`)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.accessibility.contrast')}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleHighContrastChange(false)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      !user.accessibilitySettings.highContrast
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {t('settings.accessibility.standard')}
                  </button>
                  <button
                    onClick={() => handleHighContrastChange(true)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      user.accessibilitySettings.highContrast
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {t('settings.accessibility.highContrast')}
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.accessibility.screenReader')}</h3>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={user.accessibilitySettings.screenReader}
                        onChange={(e) => handleScreenReaderChange(e.target.checked)}
                      />
                      <div className={`block w-14 h-8 rounded-full ${user.accessibilitySettings.screenReader ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${user.accessibilitySettings.screenReader ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <span className="ml-3 text-gray-700">
                      {user.accessibilitySettings.screenReader 
                        ? t('settings.accessibility.enabled')
                        : t('settings.accessibility.disabled')
                      }
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-4">
                {t('settings.notificationsDescription')}
              </p>
              
              {[
                { key: 'groupMessages', label: t('settings.groupMessageNotifications') },
                { key: 'directMessages', label: t('settings.directMessageNotifications') },
                { key: 'resourceUpdates', label: t('settings.resourceUpdateNotifications') },
                { key: 'medicationReminders', label: t('settings.medicationReminderNotifications') },
                { key: 'moodTracking', label: t('settings.moodTrackingNotifications') },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="font-medium">{setting.label}</span>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={user.notificationSettings[setting.key as keyof typeof user.notificationSettings]}
                        onChange={(e) => handleNotificationChange(setting.key as keyof typeof user.notificationSettings, e.target.checked)}
                      />
                      <div className={`block w-14 h-8 rounded-full ${user.notificationSettings[setting.key as keyof typeof user.notificationSettings] ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${user.notificationSettings[setting.key as keyof typeof user.notificationSettings] ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;