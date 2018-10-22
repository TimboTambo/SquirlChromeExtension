// need to store set of ID's as one item and then use that as a lookup of individual sets to retrieve
// also consider shortening size of each set by reducing names

// add "replace" functionality, or perhaps identify which is the "current session" based on the one that's just got saved or restored
// can add automatic update functionality that updates as tabs are opened and closed
// already populate the popup with current tabs and say "add" if we know it's not from an already-loaded session
// would require tracking which window has been saved/restored from which session

'use strict';


let savedTabSets = [];
let unsavedTabSets = [];
let thisWindowSetEl = document.getElementById('thisWindowSet');
let activeSetsEl = document.getElementById('activeSets');
let savedSetsEl = document.getElementById('savedSets');
let setEls = {thisWindow: thisWindowSetEl, active: activeSetsEl, saved: savedSetsEl};
let tabWidth = 30;
let tabMargin = 5;
let tabBorder = 1;

function renderTabSets() {
	for (let i = 0; i < savedTabSets.length; i++) {
		renderTabSet(savedTabSets[i]);
	}
	for (let i = 0; i < unsavedTabSets.length; i++) {
		renderTabSet(unsavedTabSets[i]);
	}
	updateInactiveSetsVisibility();
}

function renderTabSet(tabSet) {
	let tabSetEl = document.createElement("div");
	tabSetEl.classList.add("tabSet");
	tabSetEl.setAttribute("data-id", tabSet.id);

	let titleEl = document.createElement("div");
	titleEl.classList.add("title");
	tabSetEl.appendChild(titleEl);

	if (tabSet.isUnsaved && tabSet.isInThisWindow) {
		let newNameDivEl = document.createElement("div")
		titleEl.appendChild(newNameDivEl);

		let newNameEl = document.createElement("input");
		newNameEl.setAttribute("type", "text");
		newNameEl.setAttribute("placeholder", "Unsaved");
		newNameDivEl.appendChild(newNameEl);

		let saveEl = document.createElement("button");
		saveEl.setAttribute("class", "saveBtn");
		saveEl.setAttribute("data-id", tabSet.id);
		saveEl.classList.add("pointer");
		saveEl.textContent = "Save";
		saveEl.addEventListener("click", saveSet);
		newNameDivEl.appendChild(saveEl);
	}
	else {
		let nameEl = document.createElement("span");
		nameEl.classList.add("name");
		nameEl.textContent = tabSet.name || "Unsaved";
		if (tabSet.isInThisWindow) {
			nameEl.textContent = "\u2605 " + nameEl.textContent;
		}
		titleEl.appendChild(nameEl);	
	}
	
	let buttonsEl = document.createElement("span");
	buttonsEl.classList.add("buttons");
	titleEl.appendChild(buttonsEl);

	let updateEl;
	if (tabSet.isInThisWindow && !tabSet.isUnsaved) {
		updateEl = document.createElement("button");
		updateEl.setAttribute("class", "updateBtn");
		updateEl.setAttribute("data-id", tabSet.id);
		updateEl.classList.add("pointer");
		updateEl.textContent = "\u21A1";
		updateEl.addEventListener("click", updateSet);
		buttonsEl.appendChild(updateEl);
	}
	if (!tabSet.isInThisWindow && tabSet.window) {
		let switchEl = document.createElement("button");
		switchEl.setAttribute("class", "switchBtn");
		switchEl.setAttribute("data-id", tabSet.id);
		switchEl.classList.add("pointer");
		switchEl.textContent = "\u21CC";
		switchEl.addEventListener("click", switchToWindow);
		buttonsEl.appendChild(switchEl);
	}
	else if (!tabSet.window && !tabSet.isUnsaved) {
		let restoreEl = document.createElement("button");
		restoreEl.setAttribute("class", "restoreBtn");
		restoreEl.setAttribute("data-id", tabSet.id);
		restoreEl.classList.add("pointer");
		restoreEl.textContent = "\u21D1";
		restoreEl.addEventListener("click", restoreSet);
		buttonsEl.appendChild(restoreEl);
	}
	if (!tabSet.isUnsaved) {
		let deleteEl = document.createElement("button");
		deleteEl.setAttribute("class", "deleteBtn");
		deleteEl.setAttribute("data-id", tabSet.id);
		deleteEl.classList.add("pointer");
		deleteEl.textContent = "\u2716";
		deleteEl.addEventListener("click", deleteSet);
		buttonsEl.appendChild(deleteEl);
	}

	let tabListEl = document.createElement("div");
	tabListEl.classList.add("tabList");
	tabSetEl.appendChild(tabListEl);

	let containsUnsavedDifferences = false;
	for (let i = 0; i < tabSet.tabs.length; i++) {
		let tab = tabSet.tabs[i];
		let tabEl = document.createElement("div");
		tabEl.classList.add("tab");
		if (tab.isClosed) {
			tabEl.classList.add("closed");
			containsUnsavedDifferences = true;
		}
		else if (tab.isNew) {
			tabEl.classList.add("new");
			containsUnsavedDifferences = true;	
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
		tabDescription.textContent = tab.title ? tab.title.substring(0, 8) : "";
		tabEl.setAttribute("data-url", tab.url);
		tabEl.appendChild(tabDescription);
		tabEl.addEventListener("click", openIndividualLink);
		tabListEl.appendChild(tabEl);
	};

	if (tabSet.isInThisWindow) {
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

	if (!containsUnsavedDifferences && tabSet.isInThisWindow && !tabSet.isUnsaved) {
		updateEl.classList.add("hidden");
	}

	updatePopupWidth(tabSet);
}

function updatePopupWidth(tabSet) {
	let currentPopUpWidth = document.body.style.width;
	if (currentPopUpWidth) {
		document.body.style.width = Math.max(tabSet.tabs.length * (tabWidth + (tabMargin + tabBorder) * 2 + 10) + 10, 250, parseInt(document.body.style.width.replace("px", ""))) + "px";	
	}
	else {
		document.body.style.width = Math.max(tabSet.tabs.length * (tabWidth + (tabMargin + tabBorder) * 2 + 10) + 10, 250) + "px";	
	}
}

function updateInactiveSetsVisibility() {
	var hasInactiveSets = savedTabSets.filter(x => !x.window).length > 0;
	if (hasInactiveSets) {
		savedSetsEl.classList.remove("hidden");
	}
	else {
		savedSetsEl.classList.add("hidden");
	}
}

function getId() {
	return Math.floor((Math.random() * 10000) + 1);
}

function openIndividualLink(e) {
	let url = e.target.getAttribute("data-url");
	if (!url) {
		openIndividualLink({target: e.target.parentElement});
		return;
	}
	chrome.tabs.create({url: url});
}

function switchToWindow(e) {
	let id = parseInt(e.target.getAttribute("data-id"));
	let set = getSet(id);
	if (!set || !set.window) {
		return;
	}
	chrome.windows.update(set.window, {focused: true});
}

function saveSet(e) {
	let id = parseInt(e.target.getAttribute("data-id"));
	let set = getSet(id);
	if (!set || !set.window) {
		return;
	}
	let name = e.target.parentElement.querySelector("input").value;
    set.name = name;
    set.isUnsaved = false;
    savedTabSets.push(set);
    updateSavedSets();
    let setEl = e.target.parentNode.parentNode.parentNode;
    setEl.parentNode.removeChild(setEl);
    renderTabSet(set);
}

function updateSet(e) {
	let id = parseInt(e.target.getAttribute("data-id"));
	let set = getSet(id);
	if (!set) {
		return;
	}
	chrome.tabs.query({currentWindow: true}, function(tabs) {
        let currentOpenTabs = [];
        for (let i = 0; i < tabs.length; i++) {
	        let tab = tabs[i];
	        currentOpenTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
	    }
	    set.tabs = currentOpenTabs;
	    updateSavedSets();
	    let tabSetEl = document.querySelector(".tabSet[data-id='" + id + "']");
	    tabSetEl.parentNode.removeChild(tabSetEl);
	    renderTabSet(set);
    });	
}

function getSet(id) {
	for (let i = 0; i < savedTabSets.length; i++) {
		if (savedTabSets[i].id === id) {
			return savedTabSets[i];
		}
	}
	for (let i = 0; i < unsavedTabSets.length; i++) {
		if (unsavedTabSets[i].id === id) {
			return unsavedTabSets[i];
		}
	}
}

function deleteSet(e) {
	let id = parseInt(e.target.getAttribute("data-id"));
	let setEl = e.target.parentElement.parentElement.parentElement;
	setEl.parentNode.removeChild(setEl);
	let set = getSet(id);
	set.isUnsaved = true;
	savedTabSets.splice(savedTabSets.indexOf(set), 1);
	unsavedTabSets.push(set);
	if (set.window) {
		renderTabSet(set);
	}
	else {
		updateInactiveSetsVisibility();
	}
	updateSavedSets();
}

function updateSavedSets() {
	chrome.storage.local.set({savedTabSets: savedTabSets});
}

function restoreSet(e) {
	let id = parseInt(e.target.getAttribute("data-id"));
	let setEl = e.target.parentElement;
	let tabSet = getSet(id);
	if (!tabSet) {
		return;
	}
	
	let urls = tabSet.tabs.map(x => x.url);
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
	for (let i = 0; i < savedTabSets.length; i++) {
		let tabSet = savedTabSets[i];
		tabSet.id = i;
		tabSet.isInThisWindow = false;
		let windowStillOpen = false;
		if (tabSet.window) {
			for (let k = 0; k < openWindows.length; k++) {
				let openWindow = openWindows[k];
				if (openWindow.id === tabSet.window) {
					windowStillOpen = true;
					if (openWindow.focused) {
						tabSet.isInThisWindow = true;
					}
					let savedTabUrls = [];
					let savedTabs = [];
					
					for (let j = 0; j < tabSet.tabs.length; j++) {
						let tab = tabSet.tabs[j];
						savedTabUrls.push(tab.url);
						savedTabs.push(tab);
					}

					let currentTabs = [];
					for (let j = 0; j < openWindow.tabs.length; j++) {
						let openWindowtab = openWindow.tabs[j];
						let indexOfTabInSaved = savedTabUrls.indexOf(openWindowtab.url);
						let tab;
						if (indexOfTabInSaved > -1) {
							savedTabUrls.splice(indexOfTabInSaved, 1);
							tab = savedTabs.splice(indexOfTabInSaved, 1)[0]
							tab.isClosed = false;
						}
						else {
							tab = {iconUrl: openWindowtab.favIconUrl, url: openWindowtab.url, title: openWindowtab.title, isNew: true};
						}
						currentTabs.push(tab);
					}

					for (let j = 0; j < savedTabs.length; j++) {
						let tab = savedTabs[j];
						tab.isClosed = true;
						currentTabs.push(tab);
					}

					tabSet.tabs = currentTabs;
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

	for (let i = 0; i < openWindows.length; i++) {
        let openWindowId = openWindows[i].id;
        let windowFocused = openWindows[i].focused;
    	let currentOpenTabs = [];
        for (let j = 0; j < openWindows[i].tabs.length; j++) {
	        let tab = openWindows[i].tabs[j];
	        currentOpenTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
	    }
	    let obj = { tabs: currentOpenTabs, id: getId(), isInThisWindow: windowFocused, window: openWindowId, isUnsaved: true };
	    unsavedTabSets.push(obj);
	}
}

window.onload = function() {
	chrome.storage.local.get('savedTabSets', function(data) {
		savedTabSets = data.savedTabSets || [];
		chrome.windows.getAll({"populate" : true}, function(windows) {
			chrome.windows.getCurrent(function(currentWindow) {
				for (let i = 0; i < windows.length; i++) {
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