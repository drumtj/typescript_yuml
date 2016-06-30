/// <reference path="./jquery/jquery.d.ts"/>
///// <reference path="./chrome/chrome.d.ts"/>
/// <reference path="./TSParser/TSParser.d.ts"/>
/// <reference path="./TSFile.ts"/>
/// <reference path="./TSFileDropper.ts"/>
/// <reference path="./TSFileListView.ts"/>
/// <reference path="./SideView.ts"/>
(function () {
    var $container;
    var sideView;
    var fileDropper;
    var fileListView;
    var tabInfo;
    var extensionId;
    var tsData;
    var $detailview;
    var $detailviewSvg;
    var $codeview;
    var $ajaxloader;
    var $usecaseImg;
    var $usecaseSvg;
    function setSideView($parent) {
        sideView = new SideView("400px", "100%", "rgba(200, 200, 200, 0.79)");
        $parent.append(sideView.$el);
        fileListView = new TSFileListView("100%", (window.innerHeight - 400) + "px");
        fileDropper = new TSFileDropper(fileListView, fileDropHandle);
        sideView.$el.append(fileDropper.$el);
        sideView.$el.append(fileListView.$el);
    }
    function fileDropHandle(tsfiles) {
        for (var i = 0; i < tsfiles.length; i++) {
            fileListView.add(tsfiles[i]);
        }
        build();
    }
    function build() {
        $("body").append($ajaxloader);
        $ajaxloader.show();
        $usecaseSvg.css({ opacity: 0.5 });
        tsData = tscodeToTsobj(fileListView.getMergeText());
        send({ com: "buildUrl", script: tsobjToYUMLCode(tsData) });
    }
    var tsClassData;
    function build2(tsScript) {
        console.log("umlCode");
        $detailviewSvg.children().remove();
        $detailview.append($ajaxloader);
        $ajaxloader.show();
        tsClassData = tscodeToTsobj(tsScript, false);
        var c = tsobjToYUMLCode(tsClassData, true, false);
        console.log(c);
        send({ com: "buildUrl2", script: c });
    }
    function buildUrlComplete(src) {
        src = src.replace(".png", ".svg");
        $.ajax({
            type: "POST",
            url: src,
            success: function (data) {
                var svgDoc = data;
                var svg = svgDoc.documentElement;
                $usecaseSvg.children().remove();
                $usecaseSvg.append(svg);
                $usecaseSvg.css({ opacity: 1 });
                $ajaxloader.hide();
                $(svg).find("g>g.node").click(function () {
                    var nodeName = $(this).find("text:first").text();
                    var selectNode = (_.find(tsData.class, "name", nodeName) || _.find(tsData.interface, "name", nodeName));
                    if (selectNode) {
                        build2(selectNode.text);
                        $detailview.dialog({
                            close: function (event, ui) {
                                $detailviewSvg.children(":first").remove();
                                $usecaseSvg.append($usecaseSvg.children(":first"));
                            }
                        });
                    }
                    else {
                        alert("not found");
                    }
                }).css("cursor", "pointer");
                console.log(tsData);
            },
            error: function (e) {
                alert(e);
            }
        });
    }
    function buildUrlCompleteForTemp(src) {
        //console.log("buildUrlCompleteForTemp:", src);
        src = src.replace(".png", ".svg");
        var svgScript = $.ajax({
            type: "POST",
            url: src,
            success: function (data) {
                var svgDoc = data;
                var svg = svgDoc.documentElement;
                $detailviewSvg.append(svg);
                $ajaxloader.hide();
                console.log("tsClassData", tsClassData);
                $(svg).find("g>g.node>text").click(function () {
                    var nodeName = $(this).text();
                    if (nodeName.indexOf('(') > -1) {
                        var funcName = nodeName.match(/[A-Za-z$_0-1]+/)[0];
                        if (tsClassData && tsClassData.class[0]) {
                            var methodInfo = _.find(tsClassData.class[0].method, "name", funcName);
                            if (methodInfo) {
                                $codeview.find("pre").text(ts.transpile(methodInfo.text));
                                $codeview.dialog();
                                $codeview.dialog("option", { "width": 600, "height": 400 });
                            }
                        }
                    }
                }).css("cursor", "pointer");
                $detailview.dialog("option", {
                    "height": $detailviewSvg.children(":first").height() + 80,
                    "width": $detailviewSvg.children(":first").width() + 50
                });
            },
            error: function (e) {
                alert(e);
            }
        });
    }
    function tsobjToYUMLCode(obj, containMember, relationConnect) {
        return tj.utils.TSParser.analysisObjectToYUMLCode(obj, typeof containMember === "undefined" ? $("#memberCheck").is(":checked") : containMember, typeof relationConnect === "undefined" ? !$("#onlyInheritCheck").is(":checked") : relationConnect);
    }
    function tscodeToYUMLCode(tsScript) {
        return tsobjToYUMLCode(tscodeToTsobj(tsScript));
    }
    function tscodeToTsobj(tsScript, findUnknowObject) {
        return tj.utils.TSParser.tsToAnalysisObject(tsScript, (typeof findUnknowObject === "undefined" ? $("#unknownCheck").is(":checked") : findUnknowObject));
    }
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        switch (message.com) {
            case "init":
                tabInfo = message.tabInfo;
                extensionId = message.id;
                break;
            case "buildUrlComplete":
                buildUrlComplete(message.src);
                break;
            case "buildUrlCompleteForTemp":
                buildUrlCompleteForTemp(message.src);
                break;
        }
    });
    function send(data) {
        chrome.tabs.sendMessage(tabInfo["buildPage"].tabId, { to: "viewPage", data: data });
    }
    $(document).ready(function () {
        console.log("init");
        $container = $("#content");
        $detailview = $("#detailview");
        $ajaxloader = $('#ajax-loader');
        $usecaseImg = $('#usecaseImg');
        $detailviewSvg = $("#detailviewSvg");
        $codeview = $("#codeview");
        $usecaseSvg = $("#usecaseSvg");
        $("#buildBtn").click(function () {
            build();
        });
        setSideView($container);
    });
}());
