document.getElementById('saveCurioPage').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'saveCurioPage' });
    window.close();
});