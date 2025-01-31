window.addEventListener('message', function (event) {
    // TODO: Change origin URL here and in manifest.json
    if (event.origin !== 'http://localhost:3000') return;

    if (event.data.type === 'CURIO_SAVE_REQUEST') {
        chrome.runtime.sendMessage({
            action: 'saveCurioPage',
            targetUrl: event.data.url
        });
    }
});
