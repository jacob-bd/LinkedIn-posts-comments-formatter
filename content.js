let postInput = null;
let notificationShown = false;

function detectPostInput() {
  const newPostInput = document.querySelector('.ql-editor');
  if (newPostInput && newPostInput !== postInput) {
    postInput = newPostInput;
    showNotification();
  }
}

function showNotification() {
  if (!notificationShown) {
    chrome.runtime.sendMessage({ action: 'show-notification' });
    notificationShown = true;
  }
}

function observePostInput() {
  if (!postInput) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const selectedText = window.getSelection().toString();
        if (selectedText) {
          // Do nothing here, formatting will be handled by popup
        }
      }
    });
  });

  observer.observe(postInput, { childList: true });
}

function formatText(action) {
  if (!postInput) return;

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (selectedText) {
    let formattedText;
    switch (action) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'bullet':
        formattedText = selectedText.split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `<li>${line.trim()}</li>`)
          .join('');
        formattedText = `<ul>${formattedText}</ul>`;
        break;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    range.deleteContents();
    while (tempDiv.firstChild) {
      range.insertNode(tempDiv.firstChild);
    }
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'open-post-formatter') {
    observePostInput();
  } else if (['bold', 'italic', 'bullet'].includes(request.action)) {
    formatText(request.action);
  }
});

setInterval(detectPostInput, 1000);
