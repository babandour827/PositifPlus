import { useState, useEffect, useRef } from "react";

const KEY_ENABLED  = "pp_lock_enabled";
const KEY_PIN      = "pp_lock_pin";
const KEY_DELAY    = "pp_lock_delay"; // "0" | "60" | "300"  (seconds)
const KEY_UNLOCKED = "pp_lock_unlocked_at";

export function useAppLock() {
  const [locked, setLocked] = useState(false);
  const [covered, setCovered] = useState(false); // couverture opaque pour app-switcher
  const hiddenAt = useRef<number | null>(null);

  const isEnabled = () => localStorage.getItem(KEY_ENABLED) === "true";
  const getDelay  = () => parseInt(localStorage.getItem(KEY_DELAY) ?? "60", 10);
  const getPin    = () => localStorage.getItem(KEY_PIN) ?? "";

  // Vérifie si le verrou doit se déclencher
  function checkLock() {
    if (!isEnabled()) return;
    const delay = getDelay();
    const now = Date.now();
    const lastUnlock = parseInt(sessionStorage.getItem(KEY_UNLOCKED) ?? "0", 10);
    if (delay === 0 || (now - lastUnlock) / 1000 > delay) {
      setLocked(true);
    }
  }

  useEffect(() => {
    // Si verrou activé et pas encore déverrouillé cette session → verrouiller immédiatement
    if (isEnabled()) {
      const lastUnlock = parseInt(sessionStorage.getItem(KEY_UNLOCKED) ?? "0", 10);
      if (!lastUnlock) setLocked(true);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        // Couverture immédiate → empêche le screenshot app-switcher
        setCovered(true);
      } else {
        // Retour au premier plan
        const delay = getDelay() * 1000;
        const elapsed = hiddenAt.current ? Date.now() - hiddenAt.current : Infinity;
        if (isEnabled() && (delay === 0 || elapsed > delay)) {
          setLocked(true);
        } else {
          setCovered(false);
        }
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  function tryUnlock(pin: string): boolean {
    if (pin === getPin()) {
      sessionStorage.setItem(KEY_UNLOCKED, String(Date.now()));
      setLocked(false);
      setCovered(false);
      return true;
    }
    return false;
  }

  return { locked, covered, tryUnlock, checkLock };
}

// Helpers exposés pour les settings
export const lockSettings = {
  isEnabled: () => localStorage.getItem("pp_lock_enabled") === "true",
  getDelay:  () => localStorage.getItem("pp_lock_delay") ?? "60",
  hasPin:    () => !!localStorage.getItem("pp_lock_pin"),
  setEnabled:(v: boolean) => localStorage.setItem("pp_lock_enabled", String(v)),
  setPin:    (p: string)  => localStorage.setItem("pp_lock_pin", p),
  setDelay:  (d: string)  => localStorage.setItem("pp_lock_delay", d),
  clearPin:  ()           => { localStorage.removeItem("pp_lock_pin"); localStorage.removeItem("pp_lock_enabled"); },
};
