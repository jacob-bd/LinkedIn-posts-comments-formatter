document.addEventListener('DOMContentLoaded', function() {
  const buttons = ['bold', 'italic', 'bullet'];
  buttons.forEach(id => {
    document.getElementById(id).addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: id});
      });
    });
  });
});
