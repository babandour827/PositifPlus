export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
  language: string;
  accessibilitySettings: {
    fontSize: 'normal' | 'large' | 'x-large';
    highContrast: boolean;
    screenReader: boolean;
  };
  notificationSettings: {
    groupMessages: boolean;
    directMessages: boolean;
    resourceUpdates: boolean;
    medicationReminders: boolean;
    moodTracking: boolean;
  };
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  audioUrl?: string;
  readBy: string[];
  reactions: Reaction[];
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberIds: string[];
  createdAt: Date;
  lastActivity: Date;
  imageUrl?: string;
}

export interface DirectChat {
  id: string;
  participantIds: string[];
  lastActivity: Date;
  unreadCount: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'article' | 'video' | 'podcast' | 'testimonial';
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  createdAt: Date;
  isFavorite?: boolean;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: 'veryGood' | 'good' | 'neutral' | 'bad' | 'veryBad';
  note?: string;
  date: Date;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string[];
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  time: string;
  isCompleted: boolean;
  date: Date;
}

// New types for BioGPT integration
export interface BioGPTConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: BioGPTMessage[];
}

export interface BioGPTMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BioGPTResponse {
  content: string;
  references?: string[];
  error?: string;
}