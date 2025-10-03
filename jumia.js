import { chromium } from 'playwright';

(async () => {
  const query = "IPhone 16 Pro Max";

  const browser = await chromium.launch({ headless: false }); // يفتح نافذة حقيقية
  const page = await browser.newPage();

  try {
    await page.goto(`https://www.jumia.com.eg/catalog/?q=${encodeURIComponent(query)}`, { timeout: 60000 });
    await page.waitForSelector('article.prd h3.name', { timeout: 15000 });

    const card = await page.locator('article.prd').first();
    const title = await card.locator('h3.name').innerText().catch(() => null);
    const price = await card.locator('.prc').innerText().catch(() => null);

    console.log({ site: 'jumia', title, price });

    // خزن Screenshot حتى لو العملية نجحت
    await page.screenshot({ path: 'jumia-success.png', fullPage: true });

    // وقف هنا عشان تقدر تبص جوه المتصفح
    await page.pause();

  } catch (err) {
    console.error("Jumia error:", err.message);
    await page.screenshot({ path: 'jumia-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();