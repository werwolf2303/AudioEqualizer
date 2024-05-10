var app = {};

app.error = function () {
  return chrome.runtime.lastError;
};

app.popup = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      app.popup.message[id] = callback;
    }
  },
  "send": function (id, data) {
    if (id) {
      chrome.runtime.sendMessage({"data": data, "method": id, "path": "background-to-popup"}, app.error);
    }
  },
  "post": function (id, data) {
    if (id) {
      if (app.popup.port) {
        app.popup.port.postMessage({"data": data, "method": id, "path": "background-to-popup"});
      }
    }
  }
};

app.on = {
  "management": function (callback) {
    chrome.management.getSelf(callback);
  },
  "uninstalled": function (url) {
    chrome.runtime.setUninstallURL(url, function () {});
  },
  "installed": function (callback) {
    chrome.runtime.onInstalled.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "startup": function (callback) {
    chrome.runtime.onStartup.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "message": function (callback) {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      app.storage.load(function () {
        callback(message, sender, sendResponse);
      });
      /*  */
      return true;
    });
  }
};

app.tab = {
  "open": function (url, index, active, callback) {
    var properties = {
      "url": url, 
      "active": active !== undefined ? active : true
    };
    /*  */
    if (index !== undefined) {
      if (typeof index === "number") {
        properties.index = index + 1;
      }
    }
    /*  */
    chrome.tabs.create(properties, function (tab) {
      if (callback) callback(tab);
    }); 
  },
  "query": {
    "index": function (callback) {
      chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        var tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs[0].index);
        } else callback(undefined);
      });
    },
    "active": function (callback) {
      chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        var tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs[0]);
        } else callback(undefined);
      });
    }
  }
};

app.page = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      app.page.message[id] = callback;
    }
  },
  "post": function (id, data) {
    if (id) {
      if (app.page.port) {
        app.page.port.postMessage({"data": data, "method": id, "path": "background-to-page"});
      }
    }
  },
  "send": function (id, data, tabId, frameId) {
    if (id) {
      chrome.tabs.query({}, function (tabs) {
        var tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          var options = {
            "method": id, 
            "data": data ? data : {}, 
            "path": "background-to-page"
          };
          /*  */
          tabs.forEach(function (tab) {
            if (tab) {
              options.data.tabId = tab.id;
              options.data.top = tab.url ? tab.url : '';
              options.data.title = tab.title ? tab.title : '';
              /*  */
              if (tabId && tabId !== null) {
                if (tabId === tab.id) {
                  if (frameId && frameId !== null) {
                    chrome.tabs.sendMessage(tab.id, options, {"frameId": frameId}, function () {
                      return chrome.runtime.lastError;
                    });
                  } else {
                    chrome.tabs.sendMessage(tab.id, options, function () {
                      return chrome.runtime.lastError;
                    });
                  }
                }
              } else {
                chrome.tabs.sendMessage(tab.id, options, function () {
                  return chrome.runtime.lastError;
                });
              }
            }
          });
        }
      });
    }
  }
};

app.storage = (function () {
  chrome.storage.onChanged.addListener(function () {
    chrome.storage.local.get(null, function (e) {
      app.storage.local = e;
      if (app.storage.callback) {
        if (typeof app.storage.callback === "function") {
          app.storage.callback(true);
        }
      }
    });
  });
  /*  */
  return {
    "local": {},
    "callback": null,
    "read": function (id) {
      return app.storage.local[id];
    },
    "on": {
      "changed": function (callback) {
        if (callback) {
          app.storage.callback = callback;
        }
      }
    },
    "reload": function (callback) {
      chrome.storage.local.get(null, function (e) {
        app.storage.local = e;
        if (callback) {
          callback("reload");
        }
      });
    },
    "clear": function (callback) {
      chrome.storage.local.clear(function () {
        app.storage.reload(function () {
          if (callback) {
            callback("clear");
          }
        });
      });
    },
    "write": function (id, data, callback) {
      var tmp = {};
      tmp[id] = data;
      app.storage.local[id] = data;
      chrome.storage.local.set(tmp, function (e) {
        if (callback) {
          callback(e);
        }
      });
    },
    "load": function (callback) {
      var keys = Object.keys(app.storage.local);
      if (keys && keys.length) {
        if (callback) {
          callback("cache");
        }
      } else {
        chrome.storage.local.get(null, function (e) {
          app.storage.local = e;
          if (callback) {
            callback("disk");
          }
        });
      }
    }
  }
})();

app.contextmenus = {
  "id": "equalizer-contextmenu-id",
  "on": {
    "clicked": function (callback) {
      if (chrome.contextMenus) {
        chrome.contextMenus.onClicked.addListener(function (e) {
          app.storage.load(function () {
            callback(e);
          });
        });
      }
    }
  },
  "create": {
    "parent": function () {
      chrome.contextMenus.create({
        "contexts": ["page"], 
        "id": app.contextmenus.id,
        "title": "Audio Equalizer",
        "documentUrlPatterns": ["*://*/*"]
      }, app.error);
    },
    "enable": function () {
      chrome.contextMenus.create({
        "enabled": false,
        "contexts": ["page"],
        "title": "Add to whitelist",
        "id": "equalizer-status-enable",
        "parentId": app.contextmenus.id,
        "documentUrlPatterns": ["*://*/*"]
      }, app.error);
    },
    "disable": function () {
      chrome.contextMenus.create({
        "enabled": true,
        "contexts": ["page"],
        "id": "equalizer-status-disable",
        "title": "Remove from whitelist",
        "parentId": app.contextmenus.id,
        "documentUrlPatterns": ["*://*/*"]
      }, app.error);
    }
  },
  "load": function () {
    var toggle = function () {
      chrome.storage.local.get(null, function (data) {
        app.tab.query.active(function (tab) {
          if (tab && tab.url && tab.url.indexOf("http") === 0) {
            config.icon.update(data.eq, 1);
            var domains = config.whitelist.domains;
            var hostname = (new URL(tab.url)).hostname;
            chrome.contextMenus.update("equalizer-status-enable", {"enabled": domains.indexOf(hostname) === -1});
            chrome.contextMenus.update("equalizer-status-disable", {"enabled": domains.indexOf(hostname) !== -1});
          }
        });
      });
    };
    /*  */
    app.contextmenus.create.parent();
    app.contextmenus.create.enable();
    app.contextmenus.create.disable();
    /*  */
    chrome.tabs.onUpdated.addListener(toggle);
    chrome.tabs.onActivated.addListener(toggle);
  }
};