const API_ORIGIN = 'https://curi.ooo';

// Listen for messages from the web app
window.addEventListener('message', function (event) {
    if (event.origin !== API_ORIGIN) return;

    if (event.data.type === 'CURIO_CHECK_EXTENSION_INSTALLED') {
        window.postMessage({
            type: 'CURIO_EXTENSION_INSTALLED',
            data: { success: true },
            timeoutId: event.data.timeoutId,
        }, API_ORIGIN);
    }

    if (event.data.type === 'CURIO_SAVE_REQUEST') {
        browser.runtime.sendMessage({
            action: 'saveCurioPage',
            targetUrl: event.data.url,
            overrideOpenUrl: event.data.overrideOpenUrl,
        }, function (response) {
            if (response.success) {
                window.postMessage({
                    type: 'CURIO_SAVE_SUCCESS',
                    data: response.data,
                    timeoutId: event.data.timeoutId,
                }, API_ORIGIN);
            } else {
                window.postMessage({
                    type: 'CURIO_SAVE_ERROR',
                    error: response.error,
                    timeoutId: event.data.timeoutId,
                }, API_ORIGIN);
            }
        });
    }
});
