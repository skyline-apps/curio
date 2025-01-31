const API_HOST = 'http://localhost:3000';
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveCurioPage") {
        // If targetUrl is provided, create a new tab and capture its content
        if (request.targetUrl) {
            chrome.tabs.create({ url: request.targetUrl, active: false }, (tab) => {
                // Wait for the tab to finish loading
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === 'complete') {
                        // Remove the listener
                        chrome.tabs.onUpdated.removeListener(listener);

                        // Execute script to get page content
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            function: () => {
                                return {
                                    url: window.location.href,
                                    html: document.documentElement.outerHTML,
                                    title: document.title
                                };
                            }
                        }, (results) => {
                            const pageData = results[0].result;
                            saveContent(pageData.url, pageData.html)
                                .then(data => {
                                    // Close the temporary tab
                                    chrome.tabs.remove(tab.id);
                                    sendResponse({ success: true, data });
                                })
                                .catch(error => {
                                    chrome.tabs.remove(tab.id);
                                    sendResponse({ success: false, error: error.message });
                                });
                        });
                    }
                });
            });
            return true;
        }
        // Handle existing case for popup
        else if (request.pageData) {
            saveContent(request.pageData.url, request.pageData.html)
                .then(data => {
                    sendResponse({ success: true, data });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        } else {
            // TODO: fix this
            // Otherwise, get page data from active tab (from popup)
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    function: () => {
                        return {
                            url: window.location.href,
                            html: document.documentElement.outerHTML,
                            title: document.title
                        };
                    }
                }, (results) => {
                    const pageData = results[0].result;
                    saveContent(pageData.url, pageData.html)
                        .then(data => {
                            sendResponse({ success: true, data });
                        })
                        .catch(error => {
                            sendResponse({ success: false, error: error.message });
                        });
                });
            });
            return true;
        }
    }
});