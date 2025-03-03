const API_HOST = 'https://curi.ooo';
const API_ENDPOINTS = {
    items: `${API_HOST}/api/v1/items`,
    content: `${API_HOST}/api/v1/items/content`,
};

async function saveContent(url, htmlContent) {
    const itemResponse = await fetch(API_ENDPOINTS.items, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [{ url }] })
    });

    if (!itemResponse.ok) {
        const text = await itemResponse.text();
        throw new Error(`HTTP error status: ${itemResponse.status}, message: ${text}`);
    }

    const contentResponse = await fetch(API_ENDPOINTS.content, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, htmlContent })
    });

    if (!contentResponse.ok) {
        const text = await contentResponse.text();
        throw new Error(`HTTP error status: ${contentResponse.status}, message: ${text}`);
    }

    return contentResponse.json();
}

async function handleSaveRequest(request, sender, sendResponse) {
    try {
        let pageData;

        if (request.targetUrl) {
            // Handle new tab creation
            const tab = await new Promise(resolve =>
                chrome.tabs.create({ url: request.targetUrl, active: false }, resolve)
            );

            pageData = await new Promise((resolve, reject) => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            function: () => ({
                                url: window.location.href,
                                html: document.documentElement.outerHTML,
                                title: document.title
                            })
                        }, (results) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(results[0].result);
                            }
                        });
                    }
                });
            });

            const response = await saveContent(pageData.url, pageData.html);
            chrome.tabs.remove(tab.id);
            return { success: true, data: response };
        } else {
            // Handle existing tab from popup
            const [tab] = await new Promise(resolve =>
                chrome.tabs.query({ active: true, currentWindow: true }, resolve)
            );

            pageData = await new Promise((resolve, reject) => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => ({
                        url: window.location.href,
                        html: document.documentElement.outerHTML,
                        title: document.title
                    })
                }, (results) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(results[0].result);
                    }
                });
            });

            const response = await saveContent(pageData.url, pageData.html);
            return { success: true, data: response };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Failed to save page'
        };
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveCurioPage') {
        handleSaveRequest(request, sender, sendResponse)
            .then(sendResponse)
            .catch(error => sendResponse({
                success: false,
                error: error.message
            }));
        return true; // Keep message channel open
    }
});