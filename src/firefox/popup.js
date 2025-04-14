const API_HOST = 'https://curi.ooo';
const API_ENDPOINTS = {
    items: `${API_HOST}/api/v1/items`,
    content: `${API_HOST}/api/v1/items/content`,
};

const saveButton = document.getElementById('saveCurioPage');
const errorMessage = document.getElementById('errorMessage');
const spinner = document.createElement('span');
spinner.className = 'spinner';
let curioLink = '';

const checkExistingItems = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const params = new URLSearchParams({ urls: tab.url });

    // Get API key from storage
    const storageData = await browser.storage.local.get('curioApiKey');
    const apiKey = storageData.curioApiKey;

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['x-api-key'] = apiKey;
    }

    return fetch(`${API_ENDPOINTS.items}?${params.toString()}`, {
        method: 'GET',
        headers: headers,
    }).then(response => {
        if (!response.ok) {
            // Handle potential auth errors or other issues
            if (response.status === 401 || response.status === 403) {
                throw new Error("Authentication failed. Please sign in or set an API key.");
            } else {
                throw new Error(`HTTP error ${response.status}`);
            }
        }
        return response.json();
    });
};

window.onload = () => {
    // Send a ping to wake up the service worker
    browser.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (browser.runtime.lastError) {
            console.error("Ping failed:", browser.runtime.lastError.message);
        }
    });

    errorMessage.style.display = 'none';

    checkExistingItems()
        .then((data) => {
            saveButton.disabled = false;
            if (data.items && data.items.length > 0) {
                saveButton.textContent = "Open page in Curio";
                curioLink = `${API_HOST}/item/${data.items[0].slug}`;
            } else {
                saveButton.textContent = "Save current page";
                curioLink = "";
            }
        })
        .catch((error) => {
            saveButton.disabled = false;
            saveButton.textContent = "Open Curio";
            curioLink = `${API_HOST}`;
            const isAuthError = error.message.includes("Authentication failed");
            errorMessage.textContent = isAuthError
                ? error.message
                : "Error checking page status. Please sign in or check connection.";
            if (!isAuthError) {
                console.error("Error in checkExistingItems:", error);
            }
            errorMessage.style.display = 'block';
        });
};

saveButton.addEventListener('click', async () => {
    if (curioLink) {
        browser.tabs.create({ url: curioLink });
        window.close();
        return;
    }
    try {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        errorMessage.textContent = "";
        successMessage.textContent = "";
        saveButton.disabled = true;

        browser.runtime.sendMessage({ action: 'saveCurioPage' });
        window.close();
    } catch (error) {
        saveButton.disabled = false;
        spinner.remove();
        errorMessage.textContent = `Failed to save page: ${error.message}`;
        errorMessage.style.display = 'block';
    }
});