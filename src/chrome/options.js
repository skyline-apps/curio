function saveOptions(e) {
    e.preventDefault();
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.local.set({
        'curioApiKey': apiKey
    }, () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        status.style.color = 'green';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
}

function restoreOptions() {
    chrome.storage.local.get('curioApiKey', (res) => {
        document.getElementById('apiKey').value = res.curioApiKey || '';
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
