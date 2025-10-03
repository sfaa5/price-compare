import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

chromium.use(stealth());

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { query } = req.body;
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "query requiredd" });
  }

  const results = [];

  async function scrapeAmazon() {
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(
        `https://www.amazon.eg/s?k=${encodeURIComponent(query)}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        }
      );

      await page.waitForSelector(
        "div.s-main-slot div[data-component-type='s-search-result']",
        { timeout: 15000 }
      );

      // Get all product cards
      const cards = await page.$$(
        "div.s-main-slot div[data-component-type='s-search-result']"
      );

      let title = null;
      let price = null;

      for (const card of cards) {
        // Try to get price from this card
        const priceWhole = await card
          .$eval(".a-price .a-price-whole", (el) => el.innerText)
          .catch(() => null);
        const priceSymbol = await card
          .$eval(".a-price .a-price-symbol", (el) => el.innerText)
          .catch(() => "");
        const priceDecimal = await card
          .$eval(".a-price .a-price-decimal", (el) => el.innerText)
          .catch(() => ".");
        const priceFraction = await card
          .$eval(".a-price .a-price-fraction", (el) => el.innerText)
          .catch(() => "00");
        const cardTitle = await card
          .$eval("h2 span", (el) => el.innerText)
          .catch(() => null);

        if (priceWhole && cardTitle) {
          title = cardTitle;
          price = `${priceSymbol}${priceWhole}${priceDecimal}${priceFraction}`;
          break; // Found a valid product
        }
      }

      await browser.close();
      return { site: "amazon", title, price };
    } catch (err) {
      return { site: "amazon", error: err.message };
    }
  }

  async function scrapeJumia() {
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(
        `https://www.jumia.com.eg/catalog/?q=${encodeURIComponent(query)}`,
        { timeout: 60000 }
      );
      await page.waitForSelector("article.prd h3.name", { timeout: 15000 });

      const card = await page.locator("article.prd").first();
      const title = await card
        .locator("h3.name")
        .innerText()
        .catch(() => null);
      const price = await card
        .locator(".prc")
        .innerText()
        .catch(() => null);

      await browser.close();
      return { site: "jumia", title, price };
    } catch (err) {
      return { site: "jumia", error: err.message };
    }
  }

async function scrapeNoon() {
  try {
  const browser = await chromium.launch({ headless: true }); // can be true now
  const page = await browser.newPage();




    const url = `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(query)}`;
    console.log("🔎 Navigating to Noon:", url);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

    await page.waitForSelector('div.ProductDetailsSection_wrapper__yLBrw', { timeout: 60000 });

    

    const card = (await page.$$("div.ProductDetailsSection_wrapper__yLBrw"))[0];

    const title = await card.$eval("h2", el => el.textContent.trim()).catch(() => null);
    const price = await card.$eval("div[data-qa='plp-product-box-price']", el => el.textContent.trim()).catch(() => null);

    if (!title || !price) {
      await page.screenshot({ path: "noon_debug.png", fullPage: true });
      console.log("⚠️ Noon product not found, screenshot saved.");
    }

    await browser.close();
    return { site: "noon", title, price };
  } catch (err) {
    return { site: "noon", error: err.message };
  }
}



  // Run them in parallel
  const [amazon, jumia, noon] = await Promise.all([
    scrapeAmazon(),
    scrapeJumia(),
    scrapeNoon(),
  ]);

  results.push(amazon, jumia, noon);

  return res.status(200).json({ scraped: results });
}