let postInput = null;

function detectPostInput() {
  const newPostInput = document.querySelector('.ql-editor');
  if (newPostInput && newPostInput !== postInput) {
    postInput = newPostInput;
    observePostInput();
  }
}

function observePostInput() {
  if (!postInput) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const selectedText = window.getSelection().toString();
        if (selectedText) {
          formatText('bold', postInput);
          formatText('italic', postInput);
          formatText('bullet', postInput);
        }
      }
    });
  });

  observer.observe(postInput, { childList: true });
}

function formatText(action, postInput) {
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
  } else {
    detectPostInput();
  }
});

setInterval(detectPostInput, 1000);
