// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function(data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function(element) {
  let color = element.target.value;
  let openTabs = [];
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
    	let tab = tabs[i];
    	openTabs.push({iconUrl: tab.favIconUrl, url: tab.url, title: tab.title});	
    }
    let savedTabs = document.getElementById('savedTabs');
	for (var i = 0; i < openTabs.length; i++) {
		let tab = openTabs[i];
		let tabEl = document.createElement("div");
		if (tab.iconUrl) {
			tabEl.style = "height: 50px; width: 50px; background-image: url('" + tab.iconUrl + "'); background-size: contain; display: inline-block";	
		}
		else {
			tabEl.style = "height: 50px; width: 50px; background: black; display: inline-block";	
		}

		savedTabs.appendChild(tabEl);
	};

    chrome.storage.sync.set({openTabs: openTabs}, function() {	
    });
});
}
