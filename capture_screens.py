from playwright.sync_api import sync_playwright
import os

OUT  = r"C:\Users\hp\Desktop\images positif"
BASE = "http://localhost:5174"
VP   = {"width": 412, "height": 915}

PATIENT_PROFILE  = '{"id":"demo-patient","pseudo":"Espoir237","is_soignant":false,"is_verified":false,"cta_id":"CTA Dakar"}'
SOIGNANT_PROFILE = '{"id":"demo-soignant","pseudo":"Dr. Khadim Sall","is_soignant":true,"is_verified":true,"specialite":"Infectiologie","cta_id":"CTA Fann"}'

os.makedirs(OUT, exist_ok=True)

def shot(page, name):
    page.screenshot(path=os.path.join(OUT, name), full_page=False)
    print(f"  -> {name}")

def set_patient(page):
    page.evaluate(f"() => localStorage.setItem('pp_profile_cache', '{PATIENT_PROFILE}')")

def set_soignant(page):
    page.evaluate(f"() => localStorage.setItem('pp_profile_cache', '{SOIGNANT_PROFILE}')")

def clear_profile(page):
    page.evaluate("""() => {
        localStorage.removeItem('pp_profile_cache');
        localStorage.removeItem('pp_stealth_enabled');
        localStorage.removeItem('pp_lock_enabled');
        localStorage.removeItem('pp_lock_pin');
        localStorage.removeItem('pp_lock_delay');
        sessionStorage.clear();
    }""")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/")
    page.wait_for_load_state("networkidle")
    clear_profile(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    shot(page, "01_Splash.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/auth")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1200)
    shot(page, "02_Auth.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/onboarding")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1200)
    shot(page, "03_Onboarding.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "04_Accueil_Patient.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_soignant(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "05_Accueil_Soignant.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/tracking")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    shot(page, "06_Tracking.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "07_Echanges_Patient.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_soignant(page)
    page.goto(BASE + "/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "08_Echanges_Soignant.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    try:
        page.get_by_text("Messages", exact=True).first.click()
        page.wait_for_timeout(2000)
    except:
        pass
    shot(page, "09_Messagerie_Liste.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    try:
        page.get_by_text("Messages", exact=True).first.click()
        page.wait_for_timeout(2500)
        first_contact = page.locator("button").filter(has_text="Démarrez la conversation").first
        if first_contact.count() == 0:
            first_contact = page.locator(".flex.items-center.gap-3.px-4.py-4").first
        first_contact.click()
        page.wait_for_timeout(1500)
    except:
        pass
    shot(page, "10_Messagerie_Privee.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    try:
        page.get_by_text("Assistant IA", exact=True).first.click()
        page.wait_for_timeout(1500)
    except:
        pass
    shot(page, "11_Assistant_IA.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/resources")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "12_Ressources.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/profile")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "13_Profil.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.goto(BASE + "/app/notifications")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    shot(page, "14_Notifications.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    page.evaluate("""() => {
        localStorage.setItem('pp_stealth_enabled', 'true');
        sessionStorage.removeItem('pp_stealth_unlocked');
    }""")
    page.goto(BASE + "/")
    page.wait_for_timeout(1800)
    shot(page, "15_Mode_Discret.png")
    page.evaluate("() => localStorage.removeItem('pp_stealth_enabled')")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_patient(page)
    page.evaluate("""() => {
        localStorage.setItem('pp_lock_enabled', 'true');
        localStorage.setItem('pp_lock_pin', '1234');
        localStorage.setItem('pp_lock_delay', '0');
        sessionStorage.removeItem('pp_lock_unlocked_at');
    }""")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    shot(page, "16_Verrou_PIN.png")
    page.close()

    page = browser.new_page(viewport=VP)
    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    set_soignant(page)
    page.goto(BASE + "/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    shot(page, "17_Soignant_Patients.png")
    page.close()

    browser.close()
    captures = [f for f in os.listdir(OUT) if f.endswith(".png")]
    print(f"\n{len(captures)} captures dans : {OUT}")
