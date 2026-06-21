import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Capture console messages
        page.on("console", lambda msg: print(f"CONSOLE {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))
        
        print("Navigating to http://localhost:5000...")
        await page.goto("http://localhost:5000")
        await page.wait_for_timeout(2000)
        
        title = await page.title()
        print(f"Page title: {title}")
        
        # Check alignment or errors on headers
        print("Page HTML loaded successfully.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
