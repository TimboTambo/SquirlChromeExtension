// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// need to store set of ID's as one item and then use that as a lookup of individual sets to retrieve
// also consider shortening size of each set by reducing names

// add "replace" functionality, or perhaps identify which is the "current session" based on the one that's just got saved or restored
// can add automatic update functionality that updates as tabs are opened and closed
// already populate the popup with current tabs and say "add" if we know it's not from an already-loaded session
// would require tracking which window has been saved/restored from which session

'use strict';

var createNewBtn = document.getElementById('createNew');
var savedTabSets = [];
var thisWindowSetEl = document.getElementById('thisWindowSet');
var activeSetsEl = document.getElementById('activeSets');
var savedSetsEl = document.getElementById('savedSets');
var setEls = {thisWindow: thisWindowSetEl, active: activeSetsEl, saved: savedSetsEl};

createNewBtn.onclick = function(element) {
    let name = document.getElementById('createNewName').value;
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        var currentOpenTabs = [];
        for (var i = 0; i < tabs.length; i++) {
	        var tab = tabs[i];
	        currentOpenTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
	    }
	    chrome.windows.getCurrent(function(currentWindow) {
	    	console.log("Saving with: " + currentWindow.id);
			var obj = {name: name, tabs: currentOpenTabs, id: getId(), isActiveInWindow: true, window: currentWindow.id };
			    savedTabSets.push(obj);
			    renderTabSet(obj);
			    chrome.storage.local.set({savedTabSets: savedTabSets});
			    document.getElementById("createNewName").value = "";
			    return;
		})
    });	
}

function renderTabSets() {
	for (var i = 0; i < savedTabSets.length; i++) {
		renderTabSet(savedTabSets[i]);
	}
}

function getId() {
	return Math.floor((Math.random() * 10000) + 1);
}

function renderTabSet(tabSet) {
	var tabWidth = 30;
	var tabMargin = 5;
	var tabBorder = 1;
	var tabSetEl = document.createElement("div");
	tabSetEl.classList.add("tabSet");
	tabSetEl.setAttribute("data-id", tabSet.id);

	if (tabSet.isActiveInWindow) {
		tabSetEl.classList.add("active");
		var currentlyActiveEl = document.createElement("div");
		currentlyActiveEl.classList.add("activeMsg");
		currentlyActiveEl.textContent = "IN THIS WINDOW"
		tabSetEl.appendChild(currentlyActiveEl);
	}

	var titleEl = document.createElement("div");
	titleEl.classList.add("title");
	tabSetEl.appendChild(titleEl);

	if (tabSet.isUnsaved) {
		var newNameEl = document.createElement("input");
		newNameEl.setAttribute("type", "text");
		newNameEl.setAttribute("placeholder", "Unsaved");
		titleEl.appendChild(newNameEl);
	}

	var nameEl = document.createElement("span");
	nameEl.classList.add("name");
	nameEl.textContent = tabSet.name;
	titleEl.appendChild(nameEl);
	
	var buttonsEl = document.createElement("span");
	buttonsEl.classList.add("buttons");
	titleEl.appendChild(buttonsEl);

	if (tabSet.isUnsaved) {
		var saveEl = document.createElement("button");
		saveEl.setAttribute("class", "saveBtn");
		saveEl.setAttribute("data-id", tabSet.id);
		saveEl.classList.add("pointer");
		saveEl.textContent = "Save";
		saveEl.addEventListener("click", saveSet);
		buttonsEl.appendChild(saveEl);
	}
	if (!tabSet.isUnsaved && tabSet.isActiveInWindow) {
		var updateEl = document.createElement("button");
		updateEl.setAttribute("class", "updateBtn");
		updateEl.setAttribute("data-id", tabSet.id);
		updateEl.classList.add("pointer");
		updateEl.textContent = "Update";
		updateEl.addEventListener("click", updateSession);
		buttonsEl.appendChild(updateEl);
	}
	else if (!tabSet.isActiveInWindow && tabSet.window) {
		var switchEl = document.createElement("button");
		switchEl.setAttribute("class", "switchBtn");
		switchEl.setAttribute("data-id", tabSet.id);
		switchEl.classList.add("pointer");
		switchEl.textContent = "Switch to";
		switchEl.addEventListener("click", switchToWindow);
		buttonsEl.appendChild(switchEl);
	}
	else{
		var restoreEl = document.createElement("button");
		restoreEl.setAttribute("class", "restoreBtn");
		restoreEl.setAttribute("data-id", tabSet.id);
		restoreEl.classList.add("pointer");
		restoreEl.textContent = "Restore";
		restoreEl.addEventListener("click", restoreSet);
		buttonsEl.appendChild(restoreEl);
	}

	var deleteEl = document.createElement("button");
	deleteEl.setAttribute("class", "deleteBtn");
	deleteEl.setAttribute("data-id", tabSet.id);
	deleteEl.classList.add("pointer");
	deleteEl.textContent = "Delete";
	deleteEl.addEventListener("click", deleteSet);
	buttonsEl.appendChild(deleteEl);

	var tabListEl = document.createElement("div");
	tabListEl.classList.add("tabList");
	tabSetEl.appendChild(tabListEl);

	for (var i = 0; i < tabSet.tabs.length; i++) {
		let tab = tabSet.tabs[i];
		let tabEl = document.createElement("div");
		tabEl.classList.add("tab");
		let tabImage = document.createElement("div");
		tabImage.setAttribute("title", tab.title)
		tabImage.classList.add("tabImage");
		if (tab.iconUrl) {
			tabImage.style = "background-image: url('" + tab.iconUrl + "');";	
		}
		else {
			tabImage.classList.add("default");
		}
		tabEl.appendChild(tabImage);
		let tabDescription = document.createElement("div");
		tabDescription.classList.add("tabDescription");
		tabDescription.textContent = tab.title.substring(0, 8);
		tabEl.setAttribute("data-url", tab.url);
		tabEl.appendChild(tabDescription);
		tabEl.addEventListener("click", openIndividualLink);
		tabListEl.appendChild(tabEl);
	};

	if (tabSet.isActiveInWindow) {
		setEls.thisWindow.appendChild(tabSetEl, savedTabs.firstChild);	
		setEls.thisWindow.classList.remove("hidden");
		setEls.active.classList.remove("hidden");
	}
	else if (tabSet.window) {
		setEls.active.appendChild(tabSetEl, savedTabs.firstChild);	
		setEls.active.classList.remove("hidden");
	}
	else {
		setEls.saved.appendChild(tabSetEl, savedTabs.firstChild);	
		setEls.saved.classList.remove("hidden");
	}

	var currentDocWidth = document.body.style.width;
	if (currentDocWidth) {
		document.body.style.width = Math.max(tabSet.tabs.length * (tabWidth + (tabMargin + tabBorder) * 2 + 10) + 10, 250, parseInt(document.body.style.width.replace("px", ""))) + "px";	
	}
	else {
		document.body.style.width = Math.max(tabSet.tabs.length * (tabWidth + (tabMargin + tabBorder) * 2 + 10) + 10, 250) + "px";	
	}
}

function openIndividualLink(e) {
	var url = e.target.getAttribute("data-url");
	if (!url) {
		openIndividualLink({target: e.target.parentElement});
		return;
	}
	chrome.tabs.create({url: url});
}

function switchToWindow(e) {
	var id = parseInt(e.target.getAttribute("data-id"));
	var set = getSet(id);
	if (!set || !set.window) {
		return;
	}
	chrome.windows.update(set.window, {focused: true});
}

function saveSet(e) {
	
}

function updateSession(e) {
	var id = parseInt(e.target.getAttribute("data-id"));
	var set = getSet(id);
	if (!set) {
		return;
	}
	chrome.tabs.query({currentWindow: true}, function(tabs) {
        var currentOpenTabs = [];
        for (var i = 0; i < tabs.length; i++) {
	        var tab = tabs[i];
	        currentOpenTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
	    }
	    set.tabs = currentOpenTabs;
	    chrome.storage.local.set({savedTabSets: savedTabSets});
	    var tabSetEl = document.querySelector(".tabSet[data-id='" + id + "']");
	    tabSetEl.parentNode.removeChild(tabSetEl);
	    renderTabSet(set);
    });	
}

function getSet(id) {
	for (var i = 0; i < savedTabSets.length; i++) {
		if (savedTabSets[i].id === id) {
			return savedTabSets[i];
		}
	}
}

function deleteSet(e) {
	var id = parseInt(e.target.getAttribute("data-id"));
	var setEl = e.target.parentElement.parentElement.parentElement;
	setEl.parentNode.removeChild(setEl);
	
	for (var i = 0; i < savedTabSets.length; i++) {
		if (savedTabSets[i].id === id) {
			savedTabSets.splice(i, 1);
			chrome.storage.local.set({savedTabSets: savedTabSets});
			return;
		}
	}
}

function restoreSet(e) {
	var id = parseInt(e.target.getAttribute("data-id"));
	var setEl = e.target.parentElement;
	var tabSet = getSet(id);
	if (!tabSet) {
		return;
	}
	
	var urls = tabSet.tabs.map(x => x.url);
	chrome.windows.create({
		type: "normal",
		state: "maximized",
		url: urls
	}, function(newWindow) {
		tabSet.window = newWindow.id;
		chrome.storage.local.set({savedTabSets: savedTabSets});
	});
}

function updateWindowsData(openWindows) {
	
	for (var i = 0; i < savedTabSets.length; i++) {
		var tabSet = savedTabSets[i];
		tabSet.id = i;
		tabSet.isActiveInWindow = false;
		var windowStillOpen = false;
		if (tabSet.window) {
			for (var k = 0; k < openWindows.length; k++) {
				if (openWindows[k].id === tabSet.window) {
					windowStillOpen = true;
					if (openWindows[k].focused) {
						tabSet.isActiveInWindow = true;
					}
					openWindows.splice(k, 1);
					break;
				}	
			}
			if (!windowStillOpen) {
				tabSet.window = "";	
			}
		}	
	}
	chrome.storage.local.set({savedTabSets: savedTabSets});

	for (var i = 0; i < openWindows.length; i++) {
		var currentOpenTabs = [];
        var openWindow = openWindows[i];
        chrome.tabs.query({windowId: openWindow.id}, function(tabs) {
	        for (var j = 0; j < tabs.length; j++) {
		        var tab = tabs[j];
		        currentOpenTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
		    }
		    var obj = { tabs: currentOpenTabs, id: getId(), isActiveInWindow: openWindow.focused, window: openWindow.id, isUnsaved: true };
		    savedTabSets.push(obj);
		});
	}
}

window.onload = function() {
	chrome.storage.local.get('savedTabSets', function(data) {
		if (data.savedTabSets && data.savedTabSets.length) {
			savedTabSets = data.savedTabSets;
			chrome.windows.getAll(function(windows) {
				chrome.windows.getCurrent(function(currentWindow) {
					for (var i = 0; i < windows.length; i++) {
						if (currentWindow.id === windows[i].id) {
							windows[i].focused = true;
							break;
						}
					}
					console.log("Open windows: ");
					console.log(windows);
					console.log("Loaded tab sets: ");
					console.log(savedTabSets);
					updateWindowsData(windows);
					console.log("Processed tab sets: " );
					console.log(savedTabSets);
					renderTabSets();			
				})
			})
		};
	});
}
