import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export async function fetchPageText(url) {
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
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove noise
  document
    .querySelectorAll("script, style, nav, footer, header")
    .forEach((e) => e.remove());

  const text = document.body.textContent || "";

  // Collapse whitespace & truncate
  return text.replace(/\s+/g, " ").trim().slice(0, 12000); // token safety
}
