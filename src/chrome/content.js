const API_ORIGIN = 'http://localhost:3000';

window.addEventListener('message', function (event) {
    if (event.origin !== API_ORIGIN) return;

    if (event.data.type === 'CURIO_SAVE_REQUEST') {
        chrome.runtime.sendMessage({
            action: 'saveCurioPage',
            targetUrl: event.data.url
        }, function (response) {
            if (response.success) {
                window.postMessage({
                    type: 'CURIO_SAVE_SUCCESS',
                    data: response.data
                }, API_ORIGIN);
            } else {
                window.postMessage({
                    type: 'CURIO_SAVE_ERROR',
                    error: response.error
                }, API_ORIGIN);
            }
        });
    }
});
