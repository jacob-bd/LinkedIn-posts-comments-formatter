chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'show-notification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'LinkedIn Post Formatter',
      message: 'Post formatter is available. Click here to open.',
      buttons: [{ title: 'Open Formatter' }]
    });
  }
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
  if (buttonIndex === 0) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'open-post-formatter'});
    });
  }
});
