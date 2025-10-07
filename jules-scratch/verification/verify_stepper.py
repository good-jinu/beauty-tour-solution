from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/")

    # Step 1: Country Selection
    page.get_by_role("button", name="South Korea").click()
    page.get_by_role("button", name="Next").click()

    # Step 2: Date Selection
    page.get_by_label("Departure Date").fill("2025-10-10")
    page.get_by_label("Return Date").fill("2025-10-20")
    page.get_by_role("button", name="Next").click()

    # Step 3: Theme Selection - Take screenshot here
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
