// amazon-scraper.js
import { chromium } from "playwright";

async function runAmazonScraper(query) {
  const browser = await chromium.launch({
    headless: false, // show browser for debugging
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  });
  const page = await context.newPage();

  try {
    // Go to Amazon search results
    await page.goto(`https://www.amazon.eg/s?k=${encodeURIComponent(query)}`, {
      waitUntil: "domcontentloaded"
    });

    // Save screenshot to check what Playwright sees
    await page.screenshot({ path: "amazon-debug.png", fullPage: true });

    // Grab the first product card
   
    // Wait for the first product card to be visible
    await page.waitForSelector("div.s-main-slot div[data-component-type='s-search-result']", { timeout: 30000 });

    // Get all product cards
    const cards = await page.$$("div.s-main-slot div[data-component-type='s-search-result']");

    let title = null;
    let price = null;

    for (const card of cards) {
      // Try to get price from this card
      const priceWhole = await card.$eval('.a-price .a-price-whole', el => el.innerText).catch(() => null);
      const priceSymbol = await card.$eval('.a-price .a-price-symbol', el => el.innerText).catch(() => "");
      const priceDecimal = await card.$eval('.a-price .a-price-decimal', el => el.innerText).catch(() => ".");
      const priceFraction = await card.$eval('.a-price .a-price-fraction', el => el.innerText).catch(() => "00");
      const cardTitle = await card.$eval('h2 span', el => el.innerText).catch(() => null);

      if (priceWhole && cardTitle) {
        title = cardTitle;
        price = `${priceSymbol}${priceWhole}${priceDecimal}${priceFraction}`;
        break; // Found a valid product
      }
    }

    console.log({ site: "amazon", title, price });

  } catch (err) {
    console.error("Error scraping Amazon:", err.message);
  } finally {
    await browser.close();
  }
}

// Example run
runAmazonScraper("laptop");
