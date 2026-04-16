import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import LanguageSelector from '../components/LanguageSelector';
import { Shield, Lock, Users, BookOpen, Eye, EyeOff } from 'lucide-react';

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLoginMode) {
        const success = await login(email, password);
        if (success) navigate('/dashboard');
        else setError('Email ou mot de passe incorrect');
      } else {
        if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
        if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
        const success = await register(email, name, password);
        if (success) navigate('/dashboard');
        else setError("Erreur lors de l'inscription. Vérifiez vos informations.");
      }
    } catch (err) { setError('Une erreur est survenue. Réessayez.'); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm">
              <Shield size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Positif+</h1>
              <p className="text-emerald-100 text-sm">Votre espace de confiance</p>
            </div>
          </div>

          <h2 className="text-2xl lg:text-3xl font-semibold mb-6 leading-tight">
            Un pont numérique<br />vers votre bien-être
          </h2>
          
          <p className="text-emerald-100 mb-10 text-lg leading-relaxed max-w-md">
            Rejoignez une communauté bienveillante, échangez avec des professionnels de santé, et accédez à des informations fiables. Le tout en toute confidentialité.
          </p>

          <div className="space-y-4">
            {[
              { icon: Lock, text: "Chiffrement de bout en bout" },
              { icon: Users, text: "Communauté anonyme et solidaire" },
              { icon: BookOpen, text: "Informations médicales vérifiées" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Icon size={18} />
                </div>
                <span className="text-emerald-50">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="absolute top-4 right-4">
            <LanguageSelector buttonSize="small" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {isLoginMode ? t('welcome.login') : t('welcome.createAccount')}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {isLoginMode ? "Accédez à votre espace sécurisé" : "Créez votre profil anonyme en quelques secondes"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pseudonyme
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Choisissez un pseudonyme"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Chargement...
                  </span>
                ) : isLoginMode ? "Se connecter" : "Créer mon espace"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {isLoginMode ? "Pas encore de compte ? Créer un espace" : "Déjà un compte ? Se connecter"}
              </button>
            </div>

            {/* Security notice */}
            <div className="mt-6 flex items-start gap-2 p-3 bg-emerald-50 rounded-xl">
              <Lock size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700 leading-relaxed">
                Vos données sont chiffrées et anonymes. Aucune information nominative n'est collectée. Conforme à la Loi n° 2008-12.
              </p>
            </div>
          </div>

          {/* Emergency line */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Besoin d'aide ? Ligne Gindima : <span className="font-semibold text-gray-600">800 00 30 30</span> (gratuit, 8h-20h)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
