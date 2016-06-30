/// <reference path="./chrome/chrome.d.ts"/>

var tabInfo = {};
var tabCount = 0;
function setTabId(tabName:string, tabId:number){
	tabInfo[tabName] = {tabId:tabId};
	tabCount++;
	if( tabCount == 2 ){
    //chrome.tabs.executeScript(tabInfo["buildPage"].tabId, {code:'alert("'+ chrome.runtime.id +'");'});
    //chrome.tabs.executeScript(tabInfo["buildPage"].tabId, {file:'js/setBuildPage.js'});
  }
}

chrome.browserAction.onClicked.addListener(function(tab){
	chrome.tabs.create({url: "http://yuml.me/diagram/plane/class/draw"}, function(tab){
		setTabId("buildPage", tab.id);
	});
	chrome.tabs.create({url: "./test.html"}, function(tab){
		setTabId("viewPage", tab.id);
	});
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  console.log("updated", tabId, changeInfo, tab);
  if( changeInfo.status == "complete" ){
    chrome.tabs.sendMessage(tabId, {com:"init", id:chrome.runtime.id, tabInfo:tabInfo});
    //window.postMessage("test", "http://yuml.me/diagram/plane/class/draw");
  }
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("background message", request.message);
    /*
    if( request.message === "open_new_tab" ) {
      chrome.tabs.create({"url": request.url});
    }
    */
  }
);

/*
chrome.runtime.onMessage.addListener(function(message: any, sender: chrome.runtime.MessageSender, sendResponse: Function){
  //console.log("message", message);
  alert(message);
});
*/
