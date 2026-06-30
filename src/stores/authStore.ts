import { create } from 'zustand';
import { supabase } from "../lib/supabaseClient";
import { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkSession: () => Promise<void>; // Nouvelle méthode
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,

  // --- CONNEXION AVEC SUPABASE ---
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      set({ isLoading: false });
      return false;
    }

    // Récupérer les infos supplémentaires du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const user: User = {
      id: data.user.id,
      name: profile?.name || data.user.user_metadata?.name || '',
      email: data.user.email!,
      isAdmin: profile?.is_admin || false,
      language: profile?.language || 'fr',
      accessibilitySettings: profile?.accessibility_settings || {
        fontSize: 'normal',
        highContrast: false,
        screenReader: false
      },
      notificationSettings: profile?.notification_settings || {
        groupMessages: true,
        directMessages: true,
        resourceUpdates: true,
        medicationReminders: true,
        moodTracking: true
      }
    };

    set({ isAuthenticated: true, user, isLoading: false });
    localStorage.setItem('user', JSON.stringify(user));
    return true;
  },

  // --- INSCRIPTION AVEC SUPABASE ---
  register: async (email: string, name: string, password: string) => {
    set({ isLoading: true });
    
    // 1. Création du compte
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name } // Stocke le nom dans les metadata
      }
    });

    if (authError || !authData.user) {
      set({ isLoading: false });
      return false;
    }

    // 2. Création du profil dans la table publique
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        name,
        email,
        is_admin: false,
        language: 'fr',
        accessibility_settings: {
          fontSize: 'normal',
          highContrast: false,
          screenReader: false
        },
        notification_settings: {
          groupMessages: true,
          directMessages: true,
          resourceUpdates: true,
          medicationReminders: true,
          moodTracking: true
        }
      }]);

    void profileError; // non-bloquant : l'auth a réussi, le profil sera visible au prochain chargement

    // 3. Connexion automatique
    const user: User = {
      id: authData.user.id,
      name,
      email,
      isAdmin: false,
      language: 'fr',
      accessibilitySettings: {
        fontSize: 'normal',
        highContrast: false,
        screenReader: false
      },
      notificationSettings: {
        groupMessages: true,
        directMessages: true,
        resourceUpdates: true,
        medicationReminders: true,
        moodTracking: true
      }
    };

    set({ isAuthenticated: true, user, isLoading: false });
    localStorage.setItem('user', JSON.stringify(user));
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    set({ isAuthenticated: false, user: null });
  },

  updateUser: (userData) => {
    set((state) => {
      if (!state.user) return state;
      
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Mise à jour dans Supabase
      supabase
        .from('profiles')
        .update({
          ...userData,
          accessibility_settings: userData.accessibilitySettings,
          notification_settings: userData.notificationSettings
        })
        .eq('id', state.user.id);

      return { user: updatedUser };
    });
  },

  // --- VÉRIFICATION DE SESSION ---
  checkSession: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      set({ isAuthenticated: true, user });
    }
  }
}));

// Initialisation
const initializeAuth = () => {
  useAuthStore.getState().checkSession();
};
initializeAuth();
