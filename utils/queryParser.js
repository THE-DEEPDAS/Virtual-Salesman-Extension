function parseUserQuery(query) {
  query = query.toLowerCase();
  const keywords = query.split(/[^a-zA-Z0-9]/).filter(w => w.length > 2);

  let budget = 0;
  const budgetMatch = query.match(/(?:under|below|budget of|<|upto|maximum)\s*₹?\s*(\d{4,7})/);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1].replace(/,/g, ""));
  }

  return { budget, keywords };
}
