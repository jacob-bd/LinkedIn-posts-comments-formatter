let postInput = null;
let notificationShown = false;
let postInputObserver = null;

function detectPostInput() {
  const newPostInput = document.querySelector('.ql-editor');
  if (newPostInput &amp;&amp; newPostInput !== postInput) {
    postInput = newPostInput;
    showNotification();
    observePostInput();
  }
}

function showNotification() {
  if (!notificationShown) {
    chrome.runtime.sendMessage({action: 'show-notification'});
    notificationShown = true;
  }
}

function observePostInput() {
  if (!postInput || postInputObserver) return;

  postInputObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const selectedText = window.getSelection().toString();
        if (selectedText) {
          // Do nothing here, formatting will be handled by popup
        }
      }
    });
  });

  postInputObserver.observe(postInput, {childList: true});
}

function formatText(action) {
  if (!postInput) return;

  const selection = window.getSelection();
  if (!selection.rangeCount) {
    console.warn('No text selected.');
    return;
  }

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

const linkedInPageObserver = new MutationObserver(detectPostInput);
linkedInPageObserver.observe(document.body, {childList: true, subtree: true});
