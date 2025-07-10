document.getElementById('sendBtn').onclick = () => {
  const query = document.getElementById('userInput').value;
  const messages = document.getElementById('messages');
  messages.innerHTML += `<div class="user">You: ${query}</div>`;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'USER_QUERY',
      query: query
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
        messages.innerHTML += `<div class='bot'>Bot Error: Unable to connect to the content script. Please ensure you're on a supported page.</div>`;
      }
    });
  });
};

chrome.runtime.onMessage.addListener((msg) => {
  const messages = document.getElementById('messages');
  if (msg.type === "RECOMMENDATIONS") {
    if (!msg.items.length) {
      messages.innerHTML += `<div class='bot'>Bot: No products matched your query.</div>`;
    } else {
      messages.innerHTML += `<div class='bot'>Bot: Found ${msg.items.length} products:</div>`;
      msg.items.forEach(item => {
        messages.innerHTML += `
          <div class='card'>
            <strong>${item.title}</strong><br>
            Price: ${item.price}<br>
            <a href="${item.url}" target="_blank">View</a>
          </div>`;
      });
    }
  } else if (msg.type === "ERROR") {
    messages.innerHTML += `<div class='bot'>Bot Error: ${msg.message}</div>`;
  }
});