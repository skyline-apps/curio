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
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const params = new URLSearchParams({ urls: tab.url });
    return await fetch(`${API_ENDPOINTS.items}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    }).then((data) => {
        saveButton.disabled = false;
        if (data.items.length > 0) {
            saveButton.textContent = "Open page in Curio";
            curioLink = `${API_HOST}/item/${data.items[0].slug}`;
        } else {
            saveButton.textContent = "Save current page";
            curioLink = "";
        }
    });
};

window.onload = () => {
    // Send a ping to wake up the service worker
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Ping failed:", chrome.runtime.lastError.message);
        }
    });

    errorMessage.style.display = 'none';
    checkExistingItems().catch((_) => {
        saveButton.disabled = false;
        saveButton.textContent = "Open Curio";
        curioLink = `${API_HOST}`;
        errorMessage.textContent = "Please sign in to continue.";
        errorMessage.style.display = 'block';
    });
};

saveButton.addEventListener('click', async () => {
    if (curioLink) {
        window.open(curioLink, '_blank');
        return;
    }
    try {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        errorMessage.textContent = "";
        successMessage.textContent = "";
        saveButton.disabled = true;

        chrome.runtime.sendMessage({ action: 'saveCurioPage' });
        window.close();
    } catch (error) {
        saveButton.disabled = false;
        spinner.remove();
        errorMessage.textContent = `Failed to save page: ${error.message}`;
        errorMessage.style.display = 'block';
    }
});