const API_HOST = 'https://curi.ooo';
const API_ENDPOINTS = {
    items: `${API_HOST}/api/v1/items`,
    content: `${API_HOST}/api/v1/items/content`,
};

async function saveContent(url, htmlContent) {
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

// Function to show toast using content script
function showToast(tab, message, actionText = "", actionLink = "", isError = false) {
    browser.tabs.sendMessage(tab.id, {
        action: 'showToast',
        message,
        actionText,
        actionLink,
        isError
    });
}

let spinnerInterval;
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

async function setLoadingIcon() {
    let frameIndex = 0;
    // Clear any existing interval
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
    }
    // Start spinner animation
    browser.browserAction.setBadgeBackgroundColor({ color: '#759763' });
    spinnerInterval = setInterval(() => {
        browser.browserAction.setBadgeText({ text: spinnerFrames[frameIndex] });
        frameIndex = (frameIndex + 1) % spinnerFrames.length;
    }, 80); // Update every 80ms for smooth animation
}

async function resetIcon() {
    // Stop spinner animation
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
    }
    // Clear the badge
    browser.browserAction.setBadgeText({ text: '' });
}

async function handleSaveRequest(request, sender, sendResponse) {
    let pageData;
    await setLoadingIcon();

    if (request.targetUrl) {
        try {
            // Handle new tab creation - no toast needed
            const tab = await new Promise(resolve =>
                browser.tabs.create({ url: request.targetUrl, active: false }, resolve)
            );

            if (request.fromTab) {
                browser.scripting.executeScript({
                    target: { tabId: request.fromTab.id },
                    files: ['toast.js']
                });
            }

            pageData = await new Promise((resolve, reject) => {
                browser.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === 'complete') {
                        browser.tabs.onUpdated.removeListener(listener);
                        browser.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: () => ({
                                url: window.location.href,
                                html: document.documentElement.outerHTML,
                                title: document.title
                            })
                        }, (results) => {
                            if (browser.runtime.lastError) {
                                reject(browser.runtime.lastError);
                            } else {
                                resolve(results[0].result);
                            }
                        });
                    }
                });
            });

            const response = await saveContent(pageData.url, pageData.html);
            if (request.fromTab) {
                showToast(request.fromTab, "Link saved!", "Open in Curio", `${API_HOST}/item/${response.slug}`);
            }
            browser.tabs.remove(tab.id);
            return { success: true, data: response };
        } catch (error) {
            if (request.fromTab) {
                showToast(request.fromTab, "Failed to save link", "", "", true);
            }
            console.error("Failed to save page", error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            await resetIcon();
        }

    } else {
        const tab = await new Promise(resolve =>
            browser.tabs.query({ active: true, currentWindow: true }, resolve)
        ).then(tabs => tabs[0]);

        try {
            // Handle existing tab from popup
            browser.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['toast.js']
            });
            pageData = await new Promise((resolve, reject) => {
                browser.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => ({
                        url: window.location.href,
                        html: document.documentElement.outerHTML,
                        title: document.title
                    })
                }, (results) => {
                    if (browser.runtime.lastError) {
                        reject(browser.runtime.lastError);
                    } else {
                        resolve(results[0].result);
                    }
                });
            });

            const response = await saveContent(pageData.url, pageData.html);
            showToast(tab, "Saved successfully!", "Open in Curio", `${API_HOST}/item/${response.slug}`);
            return { success: true, data: response };
        } catch (error) {
            showToast(tab, "Failed to save page", "", "", true);
            console.error("Failed to save page", error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            await resetIcon();
        }
    }
}

// Create context menu item
browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: 'saveToCurio',
        title: 'Save to Curio',
        contexts: ['page', 'link']
    });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'saveToCurio') {
        const targetUrl = info.linkUrl;
        handleSaveRequest({ targetUrl, fromTab: tab });
    }
});

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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