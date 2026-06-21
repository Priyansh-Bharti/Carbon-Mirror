import time
import os
from playwright.sync_api import sync_playwright

def run():
    artifacts_dir = r"C:\Users\Owner\.gemini\antigravity-ide\brain\6d71a30d-9082-4cd5-8664-871f9c4d56f3"
    screenshot_path = os.path.join(artifacts_dir, "coach_conversation.png")

    with sync_playwright() as p:
        # Launch Chromium
        browser = p.chromium.launch(headless=True)
        # Create a page with standard desktop dimensions
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Listen to console logs for debugging
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        print("Navigating to AI Coach page...")
        page.goto("http://127.0.0.1:5000/coach.html")
        page.wait_for_load_state("networkidle")

        # Wait for the initial welcome message from the coach
        page.wait_for_selector(".msg-coach")
        time.sleep(1) # Let animations settle

        # --- Exchange 1 ---
        print("Clicking first chip: PM Surya Ghar Solar...")
        page.click("button:has-text('PM Surya Ghar Solar')")
        page.wait_for_function("document.getElementById('coach-textarea').value !== ''")
        page.click("#coach-send-btn")
        
        # Wait for typing indicator to hide and response to appear
        page.wait_for_selector("#typing-indicator", state="hidden")
        time.sleep(1)

        # --- Exchange 2 ---
        print("Clicking second chip: Delhi Metro Impact...")
        page.click("button:has-text('Delhi Metro Impact')")
        page.wait_for_function("document.getElementById('coach-textarea').value !== ''")
        page.click("#coach-send-btn")
        
        page.wait_for_selector("#typing-indicator", state="hidden")
        time.sleep(1)

        # --- Exchange 3 ---
        print("Clicking third chip: Meatless Alternatives...")
        page.click("button:has-text('Meatless Alternatives')")
        page.wait_for_function("document.getElementById('coach-textarea').value !== ''")
        page.click("#coach-send-btn")
        
        # Wait 500ms so user message is rendered and typing indicator is active
        time.sleep(0.5)

        # Take screenshot showing typing indicator and rate-limit counter
        print(f"Taking screenshot of the conversation: {screenshot_path}")
        page.screenshot(path=screenshot_path, full_page=True)

        # Wait for the third reply to finish rendering just to be safe
        page.wait_for_selector("#typing-indicator", state="hidden")
        time.sleep(1)
        
        browser.close()
        print("Done!")

if __name__ == "__main__":
    run()
