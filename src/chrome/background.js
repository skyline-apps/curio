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
                            chrome.storage.local.get(['savedPages'], (data) => {
                                const savedPages = data.savedPages || [];
                                savedPages.push({
                                    ...pageData,
                                    timestamp: new Date().toISOString()
                                });
                                chrome.storage.local.set({ savedPages }, () => {
                                    // Close the temporary tab
                                    chrome.tabs.remove(tab.id);
                                    sendResponse({ success: true });
                                });
                            });
                        });
                    }
                });
            });
            return true; // Will respond asynchronously
        }
        // Handle existing case for popup
        else if (request.pageData) {
            chrome.storage.local.get(['savedPages'], (data) => {
                const savedPages = data.savedPages || [];
                savedPages.push({
                    ...request.pageData,
                    timestamp: new Date().toISOString()
                });
                chrome.storage.local.set({ savedPages });
            });
        } else {
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
                    chrome.storage.local.get(['savedPages'], (data) => {
                        const savedPages = data.savedPages || [];
                        savedPages.push({
                            ...pageData,
                            timestamp: new Date().toISOString()
                        });
                        chrome.storage.local.set({ savedPages }, () => {
                            if (chrome.runtime.lastError) {
                                sendResponse({ success: false, error: chrome.runtime.lastError });
                            } else {
                                sendResponse({ success: true });
                            }
                        });
                    });
                });
            });
        }
        // Return true to indicate we will send a response asynchronously
        return true;
    }
});