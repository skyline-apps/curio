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
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
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
            curioLink = `${API_HOST}/item/${response.items[0].slug}`;
        } else {
            saveButton.textContent = "Save current page";
            curioLink = "";
        }
    }).catch((_) => {
        saveButton.disabled = false;
        saveButton.textContent = "Open Curio";
        curioLink = `${API_HOST}`;
        errorMessage.textContent = "Please sign in to continue.";
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
        saveButton.disabled = true;
        saveButton.appendChild(spinner);

        const response = await browser.runtime.sendMessage({ action: 'saveCurioPage' });
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