/// <reference path="./chrome/chrome.d.ts"/>
var tabInfo = {};
var tabCount = 0;
function setTabId(tabName, tabId) {
    tabInfo[tabName] = { tabId: tabId };
    tabCount++;
    if (tabCount == 2) {
    }
}
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.create({ url: "http://yuml.me/diagram/plane/class/draw" }, function (tab) {
        setTabId("buildPage", tab.id);
    });
    chrome.tabs.create({ url: "./test.html" }, function (tab) {
        setTabId("viewPage", tab.id);
    });
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("updated", tabId, changeInfo, tab);
    if (changeInfo.status == "complete") {
        chrome.tabs.sendMessage(tabId, { com: "init", id: chrome.runtime.id, tabInfo: tabInfo });
    }
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("background message", request.message);
});
