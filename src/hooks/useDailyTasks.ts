import { useState, useEffect, useCallback } from "react";

export interface DailyTask {
  id: number;
  title: string;
  time: string;
  done: boolean;
  icon: string; // nom de l'icône
  color: string;
  bg: string;
}

const BASE_TASKS: Omit<DailyTask, "done">[] = [
  { id: 1, title: "Prise du matin",       time: "08:00",    icon: "Sun",     color: "text-[#FF9F43]",  bg: "bg-[#FF9F43]/10" },
  { id: 2, title: "Hydratation (1.5L)",   time: "Continue", icon: "Droplets",color: "text-blue-500",   bg: "bg-blue-50" },
  { id: 3, title: "Repas équilibré",       time: "12:30",    icon: "Utensils",color: "text-[#10AC84]",  bg: "bg-[#1DD1A1]/10" },
  { id: 4, title: "Prise du soir",         time: "20:00",    icon: "Moon",    color: "text-indigo-500", bg: "bg-indigo-50" },
];

const todayKey = () => `pp_tasks_${new Date().toDateString()}`;

// Historique d'observance sur 7 jours
export interface AdherenceDay {
  date: string;   // "Mon", "Tue", ...
  pct: number;    // 0-100
  done: number;
  total: number;
}

export function getAdherenceHistory(): AdherenceDay[] {
  const days: AdherenceDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `pp_tasks_${d.toDateString()}`;
    const raw = localStorage.getItem(key);
    const label = d.toLocaleDateString("fr-FR", { weekday: "short" });
    if (raw) {
      const tasks: DailyTask[] = JSON.parse(raw);
      const done = tasks.filter(t => t.done).length;
      const total = tasks.length;
      days.push({ date: label, pct: Math.round((done / total) * 100), done, total });
    } else {
      days.push({ date: label, pct: i === 0 ? 0 : 0, done: 0, total: BASE_TASKS.length });
    }
  }
  return days;
}

export function useDailyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);

  useEffect(() => {
    const key = todayKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      setTasks(JSON.parse(stored));
    } else {
      const fresh = BASE_TASKS.map(t => ({ ...t, done: false }));
      setTasks(fresh);
      localStorage.setItem(key, JSON.stringify(fresh));
    }
  }, []);

  const toggle = useCallback((id: number) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      localStorage.setItem(todayKey(), JSON.stringify(updated));
      return updated;
    });
  }, []);

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length || 1;
  const pct = Math.round((done / total) * 100);

  return { tasks, toggle, done, total, pct };
}
