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

let createNewBtn = document.getElementById('createNew');

createNewBtn.onclick = function(element) {
  let name = document.getElementById('createNewName').value;
  
  chrome.storage.local.get("savedTabSets", function(data) {
  	chrome.tabs.query({currentWindow: true}, function(tabs) {
  		let currentSavedSets = data.savedTabSets || [];
  		let currentOpenTabs = [];
	    for (var i = 0; i < tabs.length; i++) {
	    	let tab = tabs[i];
	    	currentOpenTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
	    }
	    var obj = {name: name, tabs: currentOpenTabs, id: currentSavedSets.length};
	    currentSavedSets.push(obj);
	    renderTabSet(obj);
	    chrome.storage.local.set({savedTabSets: currentSavedSets});
	    document.getElementById("createNewName").value = "";
	});	
  });
}

function renderTabSets(tabSets) {
	let savedTabs = document.getElementById('savedTabs');
	savedTabs.innerHTML = '';
	for (var i = 0; i < tabSets.length; i++) {
		renderTabSet(tabSets[i]);
	}
}

function renderTabSet(tabSet) {
	let tabs = tabSet.tabs;
	let name = tabSet.name;
	let savedTabs = document.getElementById('savedTabs');
	let tabWidth = 30;
	let tabMargin = 5;
	let tabSetEl = document.createElement("div");

	let titleEl = document.createElement("div");
	titleEl.textContent = name;
	tabSetEl.appendChild(titleEl);

	let restoreEl = document.createElement("button");
	restoreEl.setAttribute("class", "restoreBtn");
	restoreEl.setAttribute("data-id", tabSet.id);
	restoreEl.classList.add("pointer");
	restoreEl.textContent = "restore";
	restoreEl.addEventListener("click", restoreSet);
	titleEl.appendChild(restoreEl);

	let deleteEl = document.createElement("button");
	deleteEl.setAttribute("class", "deleteBtn");
	deleteEl.setAttribute("data-id", tabSet.id);
	deleteEl.classList.add("pointer");
	deleteEl.textContent = "delete";
	deleteEl.addEventListener("click", deleteSet);
	titleEl.appendChild(deleteEl);

	for (var i = 0; i < tabs.length; i++) {
		let tab = tabs[i];
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
		tabSetEl.appendChild(tabEl);
	};
	savedTabs.appendChild(tabSetEl);

	var currentDocWidth = document.body.style.width;
	if (currentDocWidth) {
		document.body.style.width = Math.max(tabs.length * (tabWidth + tabMargin * 2 + 10), 250, parseInt(document.body.style.width.replace("px", ""))) + "px";	
	}
	else {
		document.body.style.width = Math.max((tabs.length + 1) * (tabWidth + tabMargin * 2 + 10), 250) + "px";	
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

function deleteSet(e) {
	var id = parseInt(e.target.getAttribute("data-id"));
	var setEl = e.target.parentElement.parentElement;
	setEl.parentNode.removeChild(setEl);
	chrome.storage.local.get('savedTabSets', function(data) {
		var savedTabSets = data.savedTabSets;
		for (var i = 0; i < savedTabSets.length; i++) {
			if (savedTabSets[i].id === id) {
				savedTabSets.splice(i, 1);
				chrome.storage.local.set({savedTabSets: savedTabSets});
				return;
			}
		}
	})
}

function restoreSet(e) {
	var id = parseInt(e.target.getAttribute("data-id"));
	var setEl = e.target.parentElement;
	chrome.storage.local.get('savedTabSets', function(data) {
		var savedTabSets = data.savedTabSets;
		for (var i = 0; i < savedTabSets.length; i++) {
			if (savedTabSets[i].id === id) {
				var urls = savedTabSets[i].tabs.map(x => x.url);
				chrome.windows.create({
					type: "normal",
					state: "maximized",
					url: urls
				}, function(newWindow) {
					console.log(newWindow);
				});
			}
		}
	})
}

window.onload = function() {
	chrome.storage.local.get('savedTabSets', function(data) {
		if (data.savedTabSets && data.savedTabSets.length) {
			renderTabSets(data.savedTabSets);	
		};
	});
}
