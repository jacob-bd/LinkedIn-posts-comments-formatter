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
  formatText(request.action);
});
