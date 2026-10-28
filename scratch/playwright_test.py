import asyncio
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        browser.close()

if __name__ == "__main__":
    main()
