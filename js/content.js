
console.log("content.js");

window.addEventListener("message", function(e){
	console.log( "content.js window.message", e.data );
	switch( e.data.to ){
		case "viewPage": chrome.runtime.sendMessage(e.data.data);
	}
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  console.log("content.js onMessage", message, document.location.href);
	window.postMessage(message, document.location.href);

});


(function (){
	if(document.location.href.indexOf("http://yuml.me/diagram/plane/class/draw") > -1){
		function addScript( url, onload ){
			var s = document.createElement('script');
			s.src = chrome.extension.getURL(url);
			s.async = false;
			s.onload = onload;
			(document.head||document.documentElement).appendChild(s);
		};

		var slist = ["js/setBuildPage.js"]
		var idx = 0;

		function add(){
			if( idx >= slist.length ) return;
			//console.log(slist[idx]);
			addScript( slist[idx++], add );
		}

		add();
	}

}());
