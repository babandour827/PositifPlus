import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import {
  Users, BookOpen, Activity, Bot, Phone, Shield, Lock,
  Smile, Meh, Frown, Heart, ThumbsUp, ThumbsDown
} from 'lucide-react';

const moodIcons = {
  veryGood: { icon: Heart, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
  good: { icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
  neutral: { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' },
  bad: { icon: ThumbsDown, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  veryBad: { icon: Frown, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addMoodEntry } = useTrackingStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    addMoodEntry({ mood: mood as any, date: new Date() });
    setTimeout(() => setSelectedMood(null), 2000);
  };

  const quickActions = [
    { icon: Users, label: t('dashboard.discussions'), path: '/discussions', color: 'bg-emerald-500', desc: 'Communauté' },
    { icon: BookOpen, label: t('dashboard.resources'), path: '/resources', color: 'bg-sky-500', desc: 'Articles' },
    { icon: Activity, label: t('dashboard.tracking'), path: '/tracking', color: 'bg-violet-500', desc: 'Suivi' },
    { icon: Bot, label: 'Assistant IA', path: '/biogpt', color: 'bg-amber-500', desc: 'Questions' },
  ];

  return (
    <Layout title={t('dashboard.title')}>
      <div className="space-y-6">

        {/* Welcome card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} className="text-emerald-200" />
              <span className="text-emerald-100 text-xs font-medium">{t('dashboard.secureSpace')}</span>
            </div>
            <h2 className="text-xl font-bold mb-1">
              {t('dashboard.welcomeBack')}, {user?.name || 'Anonyme'} 👋
            </h2>
            <p className="text-emerald-100 text-sm">
              Comment allez-vous aujourd'hui ?
            </p>
          </div>
        </div>

        {/* Mood tracker */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">{t('dashboard.dailyMood')}</h3>
          <div className="flex justify-around">
            {(Object.entries(moodIcons) as [string, any][]).map(([key, { icon: Icon, color, bg }]) => (
              <button
                key={key}
                onClick={() => handleMoodSelect(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  selectedMood === key ? bg + ' scale-110 border' : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <Icon size={24} className={selectedMood === key ? color : 'text-gray-400'} />
                <span className="text-[10px] text-gray-500 font-medium">
                  {t(`dashboard.moodOptions.${key}`)}
                </span>
              </button>
            ))}
          </div>
          {selectedMood && (
            <p className="text-center text-emerald-600 text-sm mt-3 font-medium">
              ✓ Humeur enregistrée
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">{t('dashboard.quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, path, color, desc }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all text-left active:scale-[0.98] group"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Emergency card */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-red-700 text-sm">{t('dashboard.emergency')}</h4>
              <p className="text-red-500 text-xs mt-1">{t('dashboard.emergencyMessage')}</p>
            </div>
            <a
              href="tel:800003030"
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex-shrink-0"
            >
              <Phone size={16} />
              <span className="hidden sm:inline">Gindima</span>
            </a>
          </div>
          <p className="text-red-400 text-[10px] mt-2">Ligne gratuite : 800 00 30 30 (8h-20h)</p>
        </div>

        {/* Security info */}
        <div className="flex items-center gap-2 justify-center py-2">
          <Shield size={12} className="text-gray-300" />
          <p className="text-[10px] text-gray-300">
            Positif+ — Données chiffrées et anonymes
          </p>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
