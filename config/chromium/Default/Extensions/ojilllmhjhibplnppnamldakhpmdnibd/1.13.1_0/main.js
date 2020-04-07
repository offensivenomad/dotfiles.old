/**
 * The background task for the chrome javascript extension.  Listens
 * for messages and opens new SSH connects in a new window.
 */

chrome.runtime.onMessage.addListener(
  function(request) {
   createWindow(request.url);
  });

/**
 * Listen for messages from the pantheon site.
 * Responds to messages asking for the version number.
 * This is used by the pantheon page to determine if user has new extension.
 * Opens a new SSH connect in a new window from a received url.
 */
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if(request.message) {
        sendResponse({version: 1.12});
    } else {
        createWindow(request.url);
    }
  });

/**
 * Opens a given url in a new window of type panel.
 * @param {string} url
 */
function createWindow(url) {
  var windowWidth = 900;
  var windowHeight = 550;
  if (url.includes('cloudshell')) {
    windowHeight = window.screen.height;
    windowWidth = window.screen.width;
  }
  chrome.windows.create({
     url: url + '&runningInExtension=true',
     type: 'panel',
     width: windowWidth,
     height: windowHeight
  });
}

