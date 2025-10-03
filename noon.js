import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

chromium.use(stealth());

async function scrapeNoon(productName) {
  const browser = await chromium.launch({ headless: true }); // can be true now
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    });

    const url = `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(productName)}`;
    console.log("Opening:", url);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

    await page.waitForSelector('div.ProductDetailsSection_wrapper__yLBrw', { timeout: 60000 });

    const product = await page.$eval(
      "div.ProductDetailsSection_wrapper__yLBrw",
      (node) => {
        const title =
          node.querySelector("h2.ProductDetailsSection_title__JorAV")
            ?.textContent?.trim() || "";
        const priceText =
          node.querySelector(
            'div[data-qa="plp-product-box-price"] strong.Price_amount__2sXa7'
          )?.textContent?.trim() || "";

        const priceValue =
          parseInt(priceText.replace(/[^\d]/g, ""), 10) || null;

        return {
          site: "noon",
          title,
          price: priceText,
          priceValue,
          currency: "EGP",
        };
      }
    )

    console.log("Noon results (DOM):", product);

    return product;
  } catch (err) {
    console.error("Noon error:", err.message);
    return { site: "noon", error: err.message };
  } finally {
    await browser.close();
  }
}

scrapeNoon("iphone 16 pro max");
