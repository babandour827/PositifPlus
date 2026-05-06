from playwright.sync_api import sync_playwright
import time

OUT = r"C:\Users\hp\Downloads"
BASE = "http://localhost:5173"
VP = {"width": 412, "height": 915}

SOIGNANT_PROFILE = '{"id":"demo","pseudo":"Dr. Diallo","is_soignant":true,"is_verified":true,"specialite":"Infectiologie","cta_id":"CTA Fann"}'

def shot(page, name):
    path = f"{OUT}\\{name}"
    page.screenshot(path=path, full_page=True)
    print(f"  -> {name} sauvegardé")

def reset_storage(page):
    page.evaluate("""() => {
        localStorage.removeItem('pp_profile_cache');
        localStorage.removeItem('pp_stealth_enabled');
        localStorage.removeItem('pp_lock_enabled');
        localStorage.removeItem('pp_lock_pin');
        localStorage.removeItem('pp_lock_delay');
        sessionStorage.removeItem('pp_stealth_unlocked');
        sessionStorage.removeItem('pp_lock_unlocked_at');
    }""")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ── Figure 9 — Accueil patient ─────────────────────────────────────────
    print("Figure 9 — Accueil patient...")
    page = browser.new_page(viewport=VP)
    page.goto(f"{BASE}/app")
    page.wait_for_load_state("networkidle")
    reset_storage(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    shot(page, "Figure_9.png")
    page.close()

    # ── Figure 10 — Accueil soignant ───────────────────────────────────────
    print("Figure 10 — Accueil soignant...")
    page = browser.new_page(viewport=VP)
    page.goto(f"{BASE}/app")
    page.wait_for_load_state("networkidle")
    page.evaluate(f"() => localStorage.setItem('pp_profile_cache', '{SOIGNANT_PROFILE}')")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    shot(page, "Figure_10.png")
    page.evaluate("() => localStorage.removeItem('pp_profile_cache')")
    page.close()

    # ── Figure 11 — Tracking ───────────────────────────────────────────────
    print("Figure 11 — Tracking...")
    page = browser.new_page(viewport=VP)
    page.goto(f"{BASE}/app/tracking")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    shot(page, "Figure_11.png")
    page.close()

    # ── Figure 12 — Échanges ───────────────────────────────────────────────
    print("Figure 12 — Échanges...")
    page = browser.new_page(viewport=VP)
    page.goto(f"{BASE}/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    shot(page, "Figure_12.png")
    page.close()

    # ── Figure 13 — Ressources ─────────────────────────────────────────────
    print("Figure 13 — Ressources...")
    page = browser.new_page(viewport=VP)
    page.goto(f"{BASE}/app/resources")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "Figure_13.png")
    page.close()

    # ── Figure 14 — Profil ─────────────────────────────────────────────────
    print("Figure 14 — Profil...")
    page = browser.new_page(viewport=VP)
    page.goto(f"{BASE}/app/profile")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "Figure_14.png")
    page.close()

    # ── Figure 15 — Mode discret ───────────────────────────────────────────
    print("Figure 15 — Mode discret...")
    page = browser.new_page(viewport=VP)
    # Pré-charge la page pour avoir accès au localStorage
    page.goto(f"{BASE}/app")
    page.wait_for_load_state("networkidle")
    page.evaluate("""() => {
        localStorage.setItem('pp_stealth_enabled', 'true');
        sessionStorage.removeItem('pp_stealth_unlocked');
    }""")
    # Navigue vers la racine pour déclencher le Splash + StealthScreen
    page.goto(f"{BASE}/")
    page.wait_for_timeout(1500)
    shot(page, "Figure_15.png")
    page.evaluate("() => localStorage.removeItem('pp_stealth_enabled')")
    page.close()

    # ── Figure 16 — Verrou PIN ─────────────────────────────────────────────
    print("Figure 16 — Verrou PIN...")
    page = browser.new_page(viewport=VP)
    page.goto(f"{BASE}/app")
    page.wait_for_load_state("networkidle")
    page.evaluate("""() => {
        localStorage.setItem('pp_lock_enabled', 'true');
        localStorage.setItem('pp_lock_pin', '1234');
        localStorage.setItem('pp_lock_delay', '0');
        sessionStorage.removeItem('pp_lock_unlocked_at');
    }""")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    shot(page, "Figure_16.png")
    page.close()

    browser.close()
    print("\nToutes les captures sont dans C:\\Users\\hp\\Downloads\\")
