chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'USER_QUERY') {
    try {
      const query = message.query.toLowerCase();
      const parsed = parseUserQuery(query);
      const products = scrapeCurrentPage();
      const matched = products.filter(p => matchProduct(p, parsed));
      chrome.runtime.sendMessage({ type: 'RECOMMENDATIONS', items: matched });
    } catch (error) {
      chrome.runtime.sendMessage({ type: 'ERROR', message: error.message });
    }
  }
});

function scrapeCurrentPage() {
  const url = window.location.href;
  const domain = url.includes("flipkart") ? "flipkart" : "amazon";

  const cards = domain === "flipkart"
    ? document.querySelectorAll("._1AtVbE")
    : document.querySelectorAll('[data-component-type="s-search-result"]');

  return Array.from(cards).map(card => {
    let title = "", price = "", link = "";

    if (domain === "amazon") {
      title = card.querySelector("h2 span")?.innerText || "";
      price = card.querySelector(".a-price .a-offscreen")?.innerText || "";
      link = card.querySelector("h2 a")?.href || "";
    } else {
      title = card.querySelector("._4rR01T")?.innerText || card.querySelector(".s1Q9rs")?.innerText || "";
      price = card.querySelector("._30jeq3")?.innerText || "";
      link = card.querySelector("a")?.href || "";
      if (!link.startsWith("http")) link = "https://www.flipkart.com" + link;
    }

    if (title && link) {
      return { title, price, url: link };
    }
  }).filter(Boolean);
}

function parseUserQuery(query) {
  const keywords = query.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2);
  let budget = 0;
  const budgetMatch = query.match(/(?:under|below|budget of|<|upto|maximum)\\s*₹?\\s*(\\d{4,7})/);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1].replace(/,/g, ""));
  }
  return { budget, keywords };
}

function matchProduct(product, parsedQuery) {
  const title = product.title.toLowerCase();
  const priceNum = Number((product.price || "0").replace(/[^\\d]/g, ""));

  if (parsedQuery.budget && priceNum > parsedQuery.budget) return false;

  let score = 0;
  parsedQuery.keywords.forEach(k => {
    if (title.includes(k)) score++;
  });

  return score > 0;
}
