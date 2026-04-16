import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, BookOpen, Activity, Bot, Settings, Shield, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.home') },
    { path: '/discussions', icon: Users, label: t('nav.community') },
    { path: '/resources', icon: BookOpen, label: t('nav.health') },
    { path: '/tracking', icon: Activity, label: t('nav.tracking') },
    { path: '/biogpt', icon: Bot, label: t('nav.ai') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <Shield size={20} className="text-emerald-600" />
          </div>
          <span className="font-bold text-lg text-gray-900">Positif+</span>
          <span className="secure-badge text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
            Chiffré
          </span>
        </div>
        {title && <h1 className="text-sm font-semibold text-gray-600 hidden md:block">{title}</h1>}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">{user?.name}</span>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-1 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.slice(0, 5).map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
