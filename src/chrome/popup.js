document.getElementById('saveCurioPage').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'saveCurioPage' });
    window.close();
});

chrome.storage.local.get(['savedPages'], (data) => {
    const savedPages = data.savedPages || [];
    const container = document.getElementById('savedPages');

    savedPages.reverse().forEach(page => {
        const div = document.createElement('div');
        div.className = 'saved-page';
        div.innerHTML = `
        <h3>${page.title}</h3>
        <p>${new Date(page.timestamp).toLocaleString()}</p>
        <p>${page.url}</p>
      `;
        container.appendChild(div);
    });
});
