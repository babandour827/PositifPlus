import { useState, useEffect } from "react";

const STORAGE_KEY = "pp_streak";

interface StreakData {
  count: number;
  lastDate: string; // toDateString()
}

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [isNew, setIsNew] = useState(false); // true si le streak vient d'augmenter aujourd'hui

  useEffect(() => {
    const today = new Date().toDateString();
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const data: StreakData = { count: 1, lastDate: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStreak(1);
      setIsNew(true);
      return;
    }

    const { count, lastDate }: StreakData = JSON.parse(raw);

    if (lastDate === today) {
      // Déjà connecté aujourd'hui
      setStreak(count);
      return;
    }

    const last = new Date(lastDate);
    const now = new Date();
    // Différence en jours calendaires (sans heures)
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((todayDay.getTime() - lastDay.getTime()) / 86400000);

    let newCount: number;
    if (diffDays === 1) {
      // Hier → on continue la série
      newCount = count + 1;
      setIsNew(true);
    } else {
      // Raté un jour ou plus → remise à zéro
      newCount = 1;
    }

    const data: StreakData = { count: newCount, lastDate: today };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStreak(newCount);
  }, []);

  return { streak, isNew };
}
