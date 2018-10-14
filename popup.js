// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// need to store set of ID's as one item and then use that as a lookup of individual sets to retrieve
// also consider shortening size of each set by reducing names

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
	    var obj = {name: name, tabs: currentOpenTabs};
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
	restoreEl.setAttribute("data-name", name);
	restoreEl.style = "cursor: pointer";
	restoreEl.textContent = "restore";
	restoreEl.addEventListener("click", restoreSet);
	titleEl.appendChild(restoreEl);

	let deleteEl = document.createElement("button");
	deleteEl.setAttribute("class", "deleteBtn");
	deleteEl.setAttribute("data-name", name);
	deleteEl.style = "cursor: pointer";
	deleteEl.textContent = "delete";
	deleteEl.addEventListener("click", deleteSet);
	titleEl.appendChild(deleteEl);

	for (var i = 0; i < tabs.length; i++) {
		let tab = tabs[i];
		let tabEl = document.createElement("div");
		tabEl.style = "display: inline-block; padding-left: " + tabMargin + "px; padding-right: " + tabMargin + "px; text-align: center; border-right: 1px solid #ccc; cursor: pointer;";
		let tabImage = document.createElement("div");
		tabImage.setAttribute("title", tab.title)
		if (tab.iconUrl) {
			tabImage.style = "height: " + tabWidth + "px; background-image: url('" + tab.iconUrl + "'); background-size: contain; background-position: center; background-repeat: no-repeat";	
		}
		else {
			tabImage.style = "height: 30px; width: 30px; background: black;";	
		}
		tabEl.appendChild(tabImage);
		let tabDescription = document.createElement("div");
		tabDescription.style = "overflow: hidden; font-size: 10px;"
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
	var name = e.target.getAttribute("data-name");
	var setEl = e.target.parentElement;
	setEl.parentNode.removeChild(setEl);
	chrome.storage.local.get('savedTabSets', function(data) {
		var savedTabSets = data.savedTabSets;
		for (var i = 0; i < savedTabSets.length; i++) {
			if (savedTabSets[i].name === name) {
				savedTabSets.splice(i, 1);
				chrome.storage.local.set({savedTabSets: savedTabSets});
				return;
			}
		}
	})
}

function restoreSet(e) {
	var name = e.target.getAttribute("data-name");
	var setEl = e.target.parentElement;
	chrome.storage.local.get('savedTabSets', function(data) {
		var savedTabSets = data.savedTabSets;
		for (var i = 0; i < savedTabSets.length; i++) {
			if (savedTabSets[i].name === name) {
				var urls = savedTabSets[i].tabs.map(x => x.url);
				chrome.windows.create({
					type: "normal",
					state: "maximized",
					url: urls
				})
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
