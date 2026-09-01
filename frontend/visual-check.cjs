const { chromium } = require("playwright");

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    await page.goto("http://localhost:5174/", { waitUntil: "networkidle" });
    await page.fill("#login-username", "admin");
    await page.fill("#login-password", "admin");
    await page.click("button[type=submit]");
    await page.waitForTimeout(1200);

    await page.goto("http://localhost:5174/bestand", { waitUntil: "networkidle" });
    await page.screenshot({ path: "../frontend-bestand.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:5174/bestand", { waitUntil: "networkidle" });
    await page.screenshot({ path: "../frontend-bestand-mobile.png", fullPage: true });

    await browser.close();
})();
