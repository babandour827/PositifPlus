import { create } from 'zustand';
import { MoodEntry, Medication, MedicationReminder } from '../types';
import { format, addDays, isSameDay } from 'date-fns';

// Mock data
const today = new Date();
const mockMoodEntries: MoodEntry[] = [
  {
    id: 'm1',
    userId: '1',
    mood: 'good',
    note: 'Journée productive avec peu de symptômes',
    date: today
  },
  {
    id: 'm2',
    userId: '1',
    mood: 'neutral',
    date: addDays(today, -1)
  },
  {
    id: 'm3',
    userId: '1',
    mood: 'bad',
    note: 'Beaucoup de douleurs aujourd\'hui',
    date: addDays(today, -2)
  },
  {
    id: 'm4',
    userId: '1',
    mood: 'good',
    date: addDays(today, -3)
  },
  {
    id: 'm5',
    userId: '1',
    mood: 'veryGood',
    note: 'Excellente journée !',
    date: addDays(today, -4)
  }
];

const mockMedications: Medication[] = [
  {
    id: 'med1',
    userId: '1',
    name: 'Metformine',
    dosage: '500mg',
    frequency: 'daily',
    time: ['08:00', '20:00'],
    startDate: addDays(today, -30),
    notes: 'Prendre avec de la nourriture'
  },
  {
    id: 'med2',
    userId: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'daily',
    time: ['08:00'],
    startDate: addDays(today, -60)
  }
];

// Generate reminders for today
const generateTodayReminders = (): MedicationReminder[] => {
  const reminders: MedicationReminder[] = [];
  const now = new Date();
  
  mockMedications.forEach(med => {
    med.time.forEach((time, index) => {
      // Convert time string to Date
      const [hours, minutes] = time.split(':').map(Number);
      const reminderDate = new Date(now);
      reminderDate.setHours(hours, minutes, 0, 0);
      
      // Check if the reminder is in the past
      const isPast = reminderDate < now;
      
      reminders.push({
        id: `rem-${med.id}-${index}`,
        medicationId: med.id,
        time,
        isCompleted: isPast, // Mark as completed if in the past
        date: new Date(format(now, 'yyyy-MM-dd'))
      });
    });
  });
  
  return reminders;
};

interface TrackingState {
  moodEntries: MoodEntry[];
  medications: Medication[];
  reminders: MedicationReminder[];
  isLoading: boolean;
  
  addMoodEntry: (mood: MoodEntry['mood'], note?: string) => void;
  addMedication: (medication: Omit<Medication, 'id' | 'userId'>) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  completeReminder: (id: string) => void;
  hasTodayMoodEntry: () => boolean;
  getTodayReminders: () => MedicationReminder[];
  getMoodDistribution: () => Record<MoodEntry['mood'], number>;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  moodEntries: mockMoodEntries,
  medications: mockMedications,
  reminders: generateTodayReminders(),
  isLoading: false,
  
  addMoodEntry: (mood, note) => {
    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      userId: '1', // Current user
      mood,
      note,
      date: new Date()
    };
    
    set(state => ({
      moodEntries: [newEntry, ...state.moodEntries]
    }));
  },
  
  addMedication: (medication) => {
    const newMedication: Medication = {
      ...medication,
      id: `med-${Date.now()}`,
      userId: '1' // Current user
    };
    
    set(state => ({
      medications: [...state.medications, newMedication]
    }));
    
    // Regenerate reminders
    set({ reminders: generateTodayReminders() });
  },
  
  updateMedication: (id, updates) => {
    set(state => ({
      medications: state.medications.map(med => 
        med.id === id ? { ...med, ...updates } : med
      )
    }));
    
    // Regenerate reminders
    set({ reminders: generateTodayReminders() });
  },
  
  deleteMedication: (id) => {
    set(state => ({
      medications: state.medications.filter(med => med.id !== id)
    }));
    
    // Regenerate reminders
    set({ reminders: generateTodayReminders() });
  },
  
  completeReminder: (id) => {
    set(state => ({
      reminders: state.reminders.map(reminder => 
        reminder.id === id ? { ...reminder, isCompleted: true } : reminder
      )
    }));
  },
  
  hasTodayMoodEntry: () => {
    const today = new Date();
    return get().moodEntries.some(entry => 
      isSameDay(entry.date, today)
    );
  },
  
  getTodayReminders: () => {
    const today = new Date();
    return get().reminders.filter(reminder => 
      isSameDay(reminder.date, today)
    );
  },
  
  getMoodDistribution: () => {
    const distribution: Record<MoodEntry['mood'], number> = {
      veryGood: 0,
      good: 0,
      neutral: 0,
      bad: 0,
      veryBad: 0
    };
    
    get().moodEntries.forEach(entry => {
      distribution[entry.mood]++;
    });
    
    return distribution;
  }
}));