// need to store set of ID's as one item and then use that as a lookup of individual sets to retrieve
// also consider shortening size of each set by reducing names

// add "replace" functionality, or perhaps identify which is the "current session" based on the one that's just got saved or restored
// can add automatic update functionality that updates as tabs are opened and closed
// already populate the popup with current tabs and say "add" if we know it's not from an already-loaded session
// would require tracking which window has been saved/restored from which session

'use strict';


var savedTabSets = [];
var unsavedTabSets = [];
var thisWindowSetEl = document.getElementById('thisWindowSet');
var activeSetsEl = document.getElementById('activeSets');
var savedSetsEl = document.getElementById('savedSets');
var setEls = {thisWindow: thisWindowSetEl, active: activeSetsEl, saved: savedSetsEl};

function renderTabSets() {
	console.log("Rendering saved tab sets...")
	console.log(savedTabSets);
	for (var i = 0; i < savedTabSets.length; i++) {
		renderTabSet(savedTabSets[i]);
	}
	console.log(unsavedTabSets);
	for (var i = 0; i < unsavedTabSets.length; i++) {
		console.log(unsavedTabSets[i]);
		renderTabSet(unsavedTabSets[i]);
	}
	console.log("Rendering unsaved tab sets...")
	console.log(unsavedTabSets);
}

function getId() {
	return Math.floor((Math.random() * 10000) + 1);
}

function renderTabSet(tabSet) {
	console.log("Rendering set");
	console.log(tabSet);
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

	if (tabSet.isUnsaved && tabSet.isActiveInWindow) {
		var newNameDivEl = document.createElement("div")
		titleEl.appendChild(newNameDivEl);

		var newNameEl = document.createElement("input");
		newNameEl.setAttribute("type", "text");
		newNameEl.setAttribute("placeholder", "Unsaved");
		newNameDivEl.appendChild(newNameEl);

		var saveEl = document.createElement("button");
		saveEl.setAttribute("class", "saveBtn");
		saveEl.setAttribute("data-id", tabSet.id);
		saveEl.classList.add("pointer");
		saveEl.textContent = "Save";
		saveEl.addEventListener("click", saveSet);
		newNameDivEl.appendChild(saveEl);
	}
	else {
		var nameEl = document.createElement("span");
		nameEl.classList.add("name");
		nameEl.textContent = tabSet.name || "Unsaved";
		titleEl.appendChild(nameEl);	
	}
	
	var buttonsEl = document.createElement("span");
	buttonsEl.classList.add("buttons");
	titleEl.appendChild(buttonsEl);

	if (tabSet.isActiveInWindow && !tabSet.isUnsaved) {
		var updateEl = document.createElement("button");
		updateEl.setAttribute("class", "updateBtn");
		updateEl.setAttribute("data-id", tabSet.id);
		updateEl.classList.add("pointer");
		updateEl.textContent = "Update";
		updateEl.addEventListener("click", updateSet);
		buttonsEl.appendChild(updateEl);
	}
	if (!tabSet.isActiveInWindow && tabSet.window) {
		var switchEl = document.createElement("button");
		switchEl.setAttribute("class", "switchBtn");
		switchEl.setAttribute("data-id", tabSet.id);
		switchEl.classList.add("pointer");
		switchEl.textContent = "Switch to";
		switchEl.addEventListener("click", switchToWindow);
		buttonsEl.appendChild(switchEl);
	}
	else if (!tabSet.window && !tabSet.isUnsaved) {
		var restoreEl = document.createElement("button");
		restoreEl.setAttribute("class", "restoreBtn");
		restoreEl.setAttribute("data-id", tabSet.id);
		restoreEl.classList.add("pointer");
		restoreEl.textContent = "Restore";
		restoreEl.addEventListener("click", restoreSet);
		buttonsEl.appendChild(restoreEl);
	}
	if (!tabSet.isUnsaved) {
		var deleteEl = document.createElement("button");
		deleteEl.setAttribute("class", "deleteBtn");
		deleteEl.setAttribute("data-id", tabSet.id);
		deleteEl.classList.add("pointer");
		deleteEl.textContent = "Delete";
		deleteEl.addEventListener("click", deleteSet);
		buttonsEl.appendChild(deleteEl);
	}

	var tabListEl = document.createElement("div");
	tabListEl.classList.add("tabList");
	tabSetEl.appendChild(tabListEl);

	var containsDifferences = false;
	for (var i = 0; i < tabSet.tabs.length; i++) {
		let tab = tabSet.tabs[i];
		let tabEl = document.createElement("div");
		tabEl.classList.add("tab");
		if (tab.isClosed) {
			tabEl.classList.add("closed");
			containsDifferences = true;
		}
		else if (tab.isNew) {
			tabEl.classList.add("new");
			containsDifferences = true;	
		}

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

	if (!containsDifferences) {
		updateEl.classList.add("hidden");
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
	var id = parseInt(e.target.getAttribute("data-id"));
	var set = getSet(id);
	if (!set || !set.window) {
		return;
	}
	var name = e.target.parentElement.querySelector("input").value;
    set.name = name;
    set.isUnsaved = false;
    savedTabSets.push(set);
    updateSavedSets();
    var setEl = e.target.parentNode.parentNode.parentNode;
    setEl.parentNode.removeChild(setEl);
    renderTabSet(set);
}

function updateSet(e) {
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
	    updateSavedSets();
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
	for (var i = 0; i < unsavedTabSets.length; i++) {
		if (unsavedTabSets[i].id === id) {
			return unsavedTabSets[i];
		}
	}
}

function deleteSet(e) {
	var id = parseInt(e.target.getAttribute("data-id"));
	var setEl = e.target.parentElement.parentElement.parentElement;
	setEl.parentNode.removeChild(setEl);
	var set = getSet(id);
	set.isUnsaved = true;
	if (set.window) {
		savedTabSets.splice(savedTabSets.indexOf(set), 1);
		renderTabSet(set);

	}
	else {
		unsavedTabSets.splice(savedTabSets.indexOf(set), 1);
	}
	updateSavedSets();
}

function updateSavedSets() {
	chrome.storage.local.set({savedTabSets: savedTabSets});
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

function updateWindowsData(openWindows, callback) {
	for (var i = 0; i < savedTabSets.length; i++) {
		var tabSet = savedTabSets[i];
		tabSet.id = i;
		tabSet.isActiveInWindow = false;
		var windowStillOpen = false;
		if (tabSet.window) {
			for (var k = 0; k < openWindows.length; k++) {
				var openWindow = openWindows[k];
				if (openWindow.id === tabSet.window) {
					windowStillOpen = true;
					if (openWindow.focused) {
						tabSet.isActiveInWindow = true;
					}
					var openUrls = [];
					var openWindowTabs = [];
					console.log("About to set tab statuses");
					for (var j = 0; j < openWindow.tabs.length; j++) {
						var tab = openWindow.tabs[j];
						openUrls.push(tab.url);
						openWindowTabs.push(tab);
					}
					console.log("Open tabs:");
					console.log(openWindowTabs)
					for (var j = 0; j < tabSet.tabs.length; j++) {
						var tab = tabSet.tabs[j];
						var indexOfTabInWindow = openUrls.indexOf(tab.url);
						if (indexOfTabInWindow > -1) {
							openUrls.splice(indexOfTabInWindow, 1);
							openWindowTabs.splice(indexOfTabInWindow, 1)
							tab.isClosed = false;
						}
						else {
							tab.isClosed = true;
						}
					}
					console.log("New tabs:");
					console.log(openWindowTabs);
					for (var j = 0; j < openWindowTabs.length; j++) {
						var tab = openWindowTabs[j];
						tabSet.tabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title, isNew: true});
					}

					var urls = 
					openWindows.splice(k, 1);
					break;
				}	
			}
			if (!windowStillOpen) {
				tabSet.window = "";	
			}
		}	
	}
	
	updateSavedSets();

	for (var i = 0; i < openWindows.length; i++) {
        let openWindowId = openWindows[i].id;
        let windowFocused = openWindows[i].focused;
        console.log("Getting tabs for window:")
        console.log("Before: " + openWindowId + ": " + windowFocused);
    	console.log("After: " + openWindowId + ": " + windowFocused);
    	var currentOpenTabs = [];
        for (var j = 0; j < openWindows[i].tabs.length; j++) {
	        var tab = openWindows[i].tabs[j];
	        currentOpenTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
	    }
	    var obj = { tabs: currentOpenTabs, id: getId(), isActiveInWindow: windowFocused, window: openWindowId, isUnsaved: true };
	    unsavedTabSets.push(obj);
	    console.log("Pushing to unsavedTabSets");
	    console.log(obj);
	}
}

window.onload = function() {
	chrome.storage.local.get('savedTabSets', function(data) {
		savedTabSets = data.savedTabSets || [];
		console.log("Saved tab sets:");
		console.log(savedTabSets);
		chrome.windows.getAll({"populate" : true}, function(windows) {
			console.log("Windows:");
			console.log(windows);
			chrome.windows.getCurrent(function(currentWindow) {
				for (var i = 0; i < windows.length; i++) {
					if (currentWindow.id === windows[i].id) {
						windows[i].focused = true;
						break;
					}
				}
				
				updateWindowsData(windows);
				renderTabSets();
			})
		})
	});
}