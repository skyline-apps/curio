const API_HOST = 'http://localhost:3000';
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
    const itemResponse = await fetch(`${API_ENDPOINTS.items}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!itemResponse.ok) {
        const text = await itemResponse.text();
        throw new Error(text);
    }
    return await itemResponse.json();
};

window.onload = () => {
    errorMessage.style.display = 'none';
    checkExistingItems().then(response => {
        saveButton.disabled = false;
        if (response.items.length > 0) {
            saveButton.textContent = "Page already saved";
            curioLink = `${API_HOST}/items/${response.items[0].slug}`;
        } else {
            saveButton.textContent = "Save current page";
        }
    }).catch(error => {
        const message = JSON.parse(error.message);
        errorMessage.textContent = `${message.error}`;
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
        saveButton.disabled = true;
        saveButton.appendChild(spinner);

        const response = await chrome.runtime.sendMessage({ action: 'saveCurioPage' });
        if (response.success) {
            checkExistingItems().then(() => {
                setTimeout(() => {
                    window.close();
                }, 1000);
            }).catch(error => {
                errorMessage.textContent = `Error: ${error.message}`;
                errorMessage.style.display = 'block';
            });
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        saveButton.disabled = false;
        spinner.remove();
        errorMessage.textContent = `Failed to save page: ${error.message}`;
        errorMessage.style.display = 'block';
    }
});