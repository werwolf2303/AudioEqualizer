var globalCounter = 0;
var options = [];

function addItem() {
    if (document.getElementById("candidate").value == "") return;
    var counter = globalCounter;
    var ul = document.getElementById("dynamic-list");
    var candidate = document.getElementById("candidate");
    var li = document.createElement("li");
    var remButton = document.createElement("button");
    remButton.onclick = function() {
        removeItemAt(counter);
    };
    remButton.textContent="X";
    options.push(candidate.value);
    li.appendChild(remButton);
    li.setAttribute("style", "display:inline");
    li.setAttribute('id', candidate.value);
    li.appendChild(document.createTextNode(candidate.value));
    li.setAttribute("id", "li" + counter);
    var br = document.createElement("br");
    li.appendChild(br);
    ul.appendChild(li);
    globalCounter++;
}

function addItemWithName(name) {
    var counter = globalCounter;
    var ul = document.getElementById("dynamic-list");
    var li = document.createElement("li");
    var remButton = document.createElement("button");
    remButton.onclick = function() {
        removeItemAt(counter);
    };
    remButton.textContent="X";
    options.push(name);
    li.appendChild(remButton);
    li.setAttribute("style", "display:inline");
    li.setAttribute('id', name);
    li.appendChild(document.createTextNode(name));
    li.setAttribute("id", "li" + counter);
    var br = document.createElement("br");
    li.appendChild(br);
    ul.appendChild(li);
    globalCounter++;
}

function removeItemAt(index) {
    options.splice(index, 1); 
    document.getElementById("dynamic-list").removeChild(document.getElementById("li" + index));
}

document.getElementById("addButton").addEventListener("click", function() {
    addItem();
});

document.addEventListener("DOMContentLoaded", function() {
    browser.storage.sync.get("blacklist").then(function(response) {
        for(var i = 0; i < response["blacklist"].length; i++) {
            addItemWithName(response["blacklist"][i]);
        }
    });
});

document.getElementById("saveButton").onclick = function() {
    saveOptions();
}

function saveOptions() {
    browser.storage.sync.set({
        blacklist: options
    });
}