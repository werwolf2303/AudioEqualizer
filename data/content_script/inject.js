window.addEventListener("message", function (e) {
  if (e.data.app === "audio-equalizer") {
    if (e.data.action === "app-icon-error") {
      chrome.runtime.sendMessage({"action": "app-icon-error"}, function () {
        return chrome.runtime.lastError;
      });
    }
    /*  */
    if (e.data.action === "app-icon-normal") {
      chrome.runtime.sendMessage({"action": "app-icon-normal"}, function () {
        return chrome.runtime.lastError;
      });
    }
  }
}, false);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "app-toggle") {
    window.postMessage({
      "app": "audio-equalizer",
      "action": "app-toggle",
      "state": request.state
    }, '*');
  }
  /*  */
  if (request.action === "app-set") {
    window.postMessage({
      "app": "audio-equalizer",
      "action": "app-set",
      "value": {
        "eq": request.eq,
        "ch": request.ch
      }
    }, '*');
  }
});

chrome.runtime.sendMessage({"action": "page-load"}, function (url) {
  browser.storage.sync.get("blacklist").then(function(response) {
    var found = false;
    try {
    for(var i = 0; i < response["blacklist"].length; i++) {
        if(response["blacklist"][i] == (new URL(url)).hostname) {
          found = true;
          break;
        }
    }
    } catch(error) {
    }
    if(found) return;
    if (url) {
      chrome.storage.local.get(null, function (data) {
        var hostname = (new URL(url)).hostname;
        var valid = data.whitelist.indexOf(hostname) === -1;
        if (valid) {
          var script = document.getElementById("audio-equalizer-script");
          if (!script) {
            script = document.createElement("script");
            script.type = "text/javascript";
            script.setAttribute("id", "audio-equalizer-script");
            script.dataset.data = JSON.stringify(data);
            script.onload = function () {script.remove()};
            script.src = chrome.runtime.getURL("data/content_script/page_context/inject.js");
            /*  */
            document.documentElement.appendChild(script);
          }
        }
      });
    }
  }, function() {
    if (url) {
      chrome.storage.local.get(null, function (data) {
        var hostname = (new URL(url)).hostname;
        var valid = data.whitelist.indexOf(hostname) === -1;
        if (valid) {
          var script = document.getElementById("audio-equalizer-script");
          if (!script) {
            script = document.createElement("script");
            script.type = "text/javascript";
            script.setAttribute("id", "audio-equalizer-script");
            script.dataset.data = JSON.stringify(data);
            script.onload = function () {script.remove()};
            script.src = chrome.runtime.getURL("data/content_script/page_context/inject.js");
            /*  */
            document.documentElement.appendChild(script);
          }
        }
      });
    }
  });
}, function () {
  return chrome.runtime.lastError;
});