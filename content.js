function formatText(action) {
  const postInput = document.querySelector('.ql-editor');
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
        formattedText = `<ul><li>${selectedText}</li></ul>`;
        break;
    }

    const span = document.createElement('span');
    span.innerHTML = formattedText;
    range.deleteContents();
    range.insertNode(span);
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  formatText(request.action);
});
