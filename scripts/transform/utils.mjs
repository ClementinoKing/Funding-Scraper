import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { chromium } from "playwright";

export async function fetchPageText(url) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const res = await fetch(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; DataBot/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const html = await res.text();
  const dom = new JSDOM(html,{
    pretendToBeVisual: false,
    resources: "usable",
    runScripts: "outside-only"
  });
  const document = dom.window.document;

  // Remove non-content elements
  document
    .querySelectorAll(
      "script, style, nav, footer, header, aside, form, button, svg, img, link"
    )
    .forEach((e) => e.remove());

  // Remove inline styles and classes
  document.querySelectorAll("*").forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("class");
    el.removeAttribute("id");
    el.removeAttribute("onclick");
  });

  let text = document.body.textContent || "";

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Remove common boilerplate phrases
  text = text.replace(
    /(cookie policy|privacy policy|terms of service|accept cookies|all rights reserved)/gi,
    ""
  );

  // Remove navigation-like fragments
  text = text.replace(
    /\b(home|about|contact|login|sign up|menu|search|subscribe)\b/gi,
    ""
  );

  // Remove markdown-like artifacts
  text = text
    .replace(/[#*_>`~\-]{2,}/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1");

  // Collapse again after removals
  text = text.replace(/\s+/g, " ").trim();

  return text.slice(0, 25000); // Final truncation for token safety, recommended is 12k.
}


export function looksLikeLoaderPage(text) {
  if (!text) return true;

  const indicators = [
    "loading",
    "please wait",
    "spinner",
    "enable javascript",
    "app-root",
    "root",
  ];

  if (text.length < 500) return true;

  return indicators.some(word =>
    text.toLowerCase().includes(word)
  );
}

export async function fetchPageTextWithBrowser(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (compatible; DataBot/1.0)"
  });

  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 30000
  });

  // Wait for meaningful content
  await page.waitForTimeout(3000);

  const text = await page.evaluate(() => {
    document
      .querySelectorAll(
        "script, style, nav, footer, header, aside, form, button, svg, img, link"
      )
      .forEach(e => e.remove());

    return document.body?.innerText || "";
  });

  await browser.close();

  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 25000);
}