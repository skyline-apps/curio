const saveButton = document.getElementById('saveCurioPage');
const errorMessage = document.getElementById('errorMessage');
const spinner = document.createElement('span');
spinner.className = 'spinner';

saveButton.addEventListener('click', async () => {
    try {
        errorMessage.style.display = 'none';
        saveButton.disabled = true;
        saveButton.appendChild(spinner);
        await chrome.runtime.sendMessage({ action: 'saveCurioPage' });
        window.close();
    } catch (error) {
        saveButton.disabled = false;
        spinner.remove();
        errorMessage.textContent = `Failed to save page: ${error.message}`;
        errorMessage.style.display = 'block';
    }
});