//recieve event from background to change URL for CC access
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    if (msg.text == 'CCAccess') {
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        var response = document.all[0].outerHTML;
        sendResponse(response);
    }
});

function log(e){
  chrome.runtime.sendMessage({
    greeting:"log",
    message:e
  });
}
