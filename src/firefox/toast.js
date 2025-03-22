// Create and inject toast styles if not already present
if (!document.querySelector('#curio-toast-styles')) {
  const style = document.createElement('style');
  style.id = 'curio-toast-styles';
  style.textContent = `
  .curio-toast {
    position: fixed;
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    gap: 8px;
    bottom: 20px;
    right: 20px;
    background: #FAF7F6;
    color: #1A1F1C;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 2147483647;
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s ease;
  }
  .curio-toast.show {
    opacity: 1;
    transform: translateY(0);
  }
  .curio-toast.error {
    background: #E7C9C5;
  }
  .curio-toast a {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    height: 28px;
    cursor: pointer;
    border-radius: 2px;
    text-decoration: none;
  }
  .curio-toast .action {
    background: #759763;
    color: white;
  }
  .curio-toast .action:hover {
    background: #5A8254;
  }
`;
  document.head.appendChild(style);
}

function showToast(message, actionText = "", actionLink = "", isError = false) {
  // Remove any existing toast
  const existingToast = document.querySelector('.curio-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement('div');
  toast.dir = "ltr";
  toast.className = `curio-toast${isError ? ' error' : ''}`;
  toast.textContent = message;
  if (actionText && actionLink) {
    const action = document.createElement('a');
    action.className = "action";
    action.textContent = actionText;
    action.href = actionLink;
    action.target = '_blank';
    toast.appendChild(action);
  }
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove toast after 6 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 6000);
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showToast') {
    showToast(request.message, request.actionText, request.actionLink, request.isError);
  }
});
