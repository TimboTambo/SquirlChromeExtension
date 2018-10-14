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
var openWindows = [];
var savedTabSets = [];

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
			var obj = {name: name, tabs: currentOpenTabs, id: savedTabSets.length, isActiveInWindow: true, windows: [currentWindow.id] };
			    savedTabSets.push(obj);
			    renderTabSet(obj);
			    chrome.storage.local.set({savedTabSets: savedTabSets});
			    document.getElementById("createNewName").value = "";
			    return;
		})
    });	
}

function renderTabSets() {
	var savedTabsEl = document.getElementById('savedTabs');
	savedTabsEl.innerHTML = '';
	for (var i = 0; i < savedTabSets.length; i++) {
		renderTabSet(savedTabSets[i]);
	}
}

function renderTabSet(tabSet) {
	var savedTabsEl = document.getElementById('savedTabs');
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

	var nameEl = document.createElement("span");
	nameEl.classList.add("name");
	nameEl.textContent = tabSet.name;
	titleEl.appendChild(nameEl);
	
	if (tabSet.isActiveInWindow) {
		var updateEl = document.createElement("button");
		updateEl.setAttribute("class", "updateBtn");
		updateEl.setAttribute("data-id", tabSet.id);
		updateEl.classList.add("pointer");
		updateEl.textContent = "Update";
		updateEl.addEventListener("click", updateSession);
		titleEl.appendChild(updateEl);
	}
	else if (tabSet.windows.length) {
		var switchEl = document.createElement("button");
		switchEl.setAttribute("class", "switchBtn");
		switchEl.setAttribute("data-id", tabSet.id);
		switchEl.classList.add("pointer");
		switchEl.textContent = "Switch to";
		switchEl.addEventListener("click", switchToWindow);
		titleEl.appendChild(switchEl);
	}
	else{
		var restoreEl = document.createElement("button");
		restoreEl.setAttribute("class", "restoreBtn");
		restoreEl.setAttribute("data-id", tabSet.id);
		restoreEl.classList.add("pointer");
		restoreEl.textContent = "Restore";
		restoreEl.addEventListener("click", restoreSet);
		titleEl.appendChild(restoreEl);
	}

	var deleteEl = document.createElement("button");
	deleteEl.setAttribute("class", "deleteBtn");
	deleteEl.setAttribute("data-id", tabSet.id);
	deleteEl.classList.add("pointer");
	deleteEl.textContent = "Delete";
	deleteEl.addEventListener("click", deleteSet);
	titleEl.appendChild(deleteEl);

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
		savedTabsEl.insertBefore(tabSetEl, savedTabs.firstChild);	
	}
	else {
		savedTabsEl.appendChild(tabSetEl);	
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
	if (!set || !set.windows) {
		return;
	}
	var windowId = set.windows[0];
	chrome.windows.update(windowId, {focused: true});
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
	var setEl = e.target.parentElement.parentElement;
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
		if (!tabSet.windows) {
			tabSet.windows = [];
		}
		tabSet.windows.push(newWindow.id);
		openWindows.push(newWindow);
		chrome.storage.local.set({savedTabSets: savedTabSets});
	});
}

function updateWindowsData() {
	for (var i = 0; i < savedTabSets.length; i++) {
		var tabSet = savedTabSets[i];
		tabSet.isActiveInWindow = false;
		if (tabSet.windows && tabSet.windows.length) {
			for (var j = 0; j < tabSet.windows.length; j++) {
				var updatedAssociatedWindows = [];
				for (var k = 0; k < openWindows.length; k++) {
					if (openWindows[k].id === tabSet.windows[j]) {
						updatedAssociatedWindows.push(openWindows[k].id);
						if (openWindows[k].focused) {
							tabSet.isActiveInWindow = true;
						}
					}	
				}
			}
			tabSet.windows = updatedAssociatedWindows;
		}	
	}
	chrome.storage.local.set({savedTabSets: savedTabSets});
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
					openWindows = windows;
					console.log("Open windows: ");
					console.log(openWindows);
					console.log("Loaded tab sets: ");
					console.log(savedTabSets);
					updateWindowsData();
					console.log("Processed tab sets: " );
					console.log(savedTabSets);
					renderTabSets();			
				})
			})
		};
	});
}
