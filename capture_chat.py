from playwright.sync_api import sync_playwright
import json, os

OUT  = r"C:\Users\hp\Desktop\images positif"
BASE = "http://localhost:5174"
VP   = {"width": 412, "height": 915}

PATIENT_PROFILE = '{"id":"demo-patient","pseudo":"Espoir237","is_soignant":false,"is_verified":false,"cta_id":"CTA Dakar"}'

MOCK_SOIGNANTS = json.dumps([
    {"id": "doc-1", "pseudo": "Dr. Khadim Sall",     "cta_id": "CTA Fann",      "specialite": "Infectiologie",   "is_verified": True},
    {"id": "doc-2", "pseudo": "Dr. Aissatou Diallo",  "cta_id": "CTA Principal", "specialite": "Medecine interne","is_verified": True},
    {"id": "doc-3", "pseudo": "Dr. Moussa Ndiaye",    "cta_id": "CTA Kaolack",   "specialite": "Pediatrie",       "is_verified": False},
])

MOCK_MESSAGES = json.dumps([
    {"id":"m1","sender_id":"doc-1","receiver_id":"demo-patient","content":"Bonjour ! Comment allez-vous aujourd'hui ?","is_read":True,"created_at":"2026-05-12T10:24:00Z","expires_at":None,"media_url":None,"duration":None},
    {"id":"m2","sender_id":"demo-patient","receiver_id":"doc-1","content":"Bonjour Docteur, je vais bien merci. J'avais une question sur mon traitement.","is_read":True,"created_at":"2026-05-12T10:25:00Z","expires_at":None,"media_url":None,"duration":None},
    {"id":"m3","sender_id":"doc-1","receiver_id":"demo-patient","content":"Bien sur, je vous ecoute. Posez votre question sans hesitation.","is_read":True,"created_at":"2026-05-12T10:26:00Z","expires_at":None,"media_url":None,"duration":None},
    {"id":"m4","sender_id":"demo-patient","receiver_id":"doc-1","content":"Est-ce que je peux decaler ma prise du soir de 1h ? Je travaille en equipe de nuit ce week-end.","is_read":True,"created_at":"2026-05-12T10:28:00Z","expires_at":None,"media_url":None,"duration":None},
    {"id":"m5","sender_id":"doc-1","receiver_id":"demo-patient","content":"Oui, une variation d'1h est tout a fait acceptable. L'essentiel est de garder un intervalle regulier entre les prises.","is_read":True,"created_at":"2026-05-12T10:30:00Z","expires_at":None,"media_url":None,"duration":None},
    {"id":"m6","sender_id":"demo-patient","receiver_id":"doc-1","content":"Merci beaucoup Docteur !","is_read":True,"created_at":"2026-05-12T10:31:00Z","expires_at":None,"media_url":None,"duration":None},
])

def handle_route(route):
    url = route.request.url
    if "profiles" in url and "is_soignant" in url:
        route.fulfill(status=200, content_type="application/json", body=MOCK_SOIGNANTS)
    elif "messages" in url and route.request.method == "GET":
        route.fulfill(status=200, content_type="application/json", body=MOCK_MESSAGES)
    elif "messages" in url and route.request.method in ("POST", "PATCH", "DELETE"):
        route.fulfill(status=200, content_type="application/json", body="[]")
    elif "friendships" in url or "groups" in url or "reports" in url:
        route.fulfill(status=200, content_type="application/json", body="[]")
    else:
        route.continue_()

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(viewport=VP)
    page.route("**/rest/v1/**", handle_route)

    page.goto(BASE + "/app")
    page.wait_for_load_state("networkidle")
    page.evaluate(f"() => localStorage.setItem('pp_profile_cache', '{PATIENT_PROFILE}')")
    page.goto(BASE + "/app/echanges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    page.get_by_text("Messages", exact=True).first.click()
    page.wait_for_timeout(2000)
    page.get_by_text("Dr. Khadim Sall").first.click()
    page.wait_for_timeout(2000)

    page.screenshot(path=os.path.join(OUT, "10_Messagerie_Privee.png"), full_page=False)
    print("  -> 10_Messagerie_Privee.png")

    browser.close()
