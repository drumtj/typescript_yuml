(function () {
    var $container;
    var sideView;
    var fileDropper;
    var fileListView;
    var tabInfo;
    var extensionId;
    var extension = "svg";
    var tsData;
    var $detailview;
    var $detailviewSvg;
    var $codeview;
    var $ajaxloader;
    var $usecaseImg;
    var $usecaseSvg;
    tj.utils.TSParser.init();
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
    function build(ext) {
        if (ext === void 0) { ext = "svg"; }
        extension = ext;
        $("body").append($ajaxloader);
        $ajaxloader.show();
        $usecaseSvg.css({ opacity: 0.5 });
        tsData = tscodeToTsobj(fileListView.getMergeText());
        send({ com: "buildUrl", script: tsobjToYUMLCode(tsData) });
    }
    var tsClassData;
    function targetBuild(className) {
        var obj;
        if ((obj = _.find(tsData.class, "name", className))) {
            tsClassData = {
                class: [obj],
                genericList: tsData.genericList
            };
        }
        else if ((obj = _.find(tsData.interface, "name", className))) {
            tsClassData = {
                interface: [obj],
                genericList: tsData.genericList
            };
        }
        else {
            return false;
        }
        $detailviewSvg.children().remove();
        $detailview.append($ajaxloader);
        $ajaxloader.show();
        send({ com: "buildUrl2", script: tsobjToYUMLCode(tsClassData, true, false) });
        return true;
    }
    function buildUrlComplete(src) {
        if (extension == "png") {
            window.open(src, "_blank");
            $usecaseSvg.css({ opacity: 1 });
            $ajaxloader.hide();
        }
        else {
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
                    var $svg = $(svg);
                    var $bindTarget;
                    if ($("#memberCheck").is(":checked")) {
                        $bindTarget = $svg.find("g>g.node>text").click(function (e) {
                            var $classNameNode = $(this).parent().find("text:first");
                            var className = $classNameNode.text();
                            if ($(this).is($classNameNode)) {
                                classClick(className);
                            }
                            else {
                                var methodName = $(this).text().match(/([A-Za-z$_0-1]+)(\s+)?\(/);
                                if (methodName && methodName[1]) {
                                    methodClick(className, methodName[1]);
                                }
                                else {
                                    alert("The function name in the wrong format.\n" + methodName);
                                }
                            }
                        });
                    }
                    else {
                        $bindTarget = $svg.find("g>g.node").click(function (e) {
                            classClick($(this).find("text:first").text());
                        });
                    }
                    $bindTarget.hover(function () {
                        $(this).css("text-decoration", "underline");
                    }, function () {
                        $(this).css("text-decoration", "");
                    })
                        .css("cursor", "pointer");
                    console.log(tsData);
                },
                error: function (e) {
                    alert(e);
                }
            });
        }
    }
    function classClick(className) {
        if (targetBuild(className)) {
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
    }
    function methodClick(className, methodName) {
        console.log(className, methodName);
        var classObj = _.find(tsData.class, "name", className);
        if (classObj) {
            var methodInfo = _.find(classObj.method, "name", methodName);
            if (methodInfo) {
                var script = ts.transpile(methodInfo.text);
                $codeview.find("xmp").html(script).removeClass("prettyprinted");
                $codeview.dialog({
                    open: function () {
                        if (window['prettyPrint'])
                            window['prettyPrint']();
                    }
                });
                $codeview.dialog("option", { "width": 600, "height": 400 });
            }
            else {
                alert("can not found");
            }
        }
    }
    function buildUrlCompleteForTemp(src) {
        src = src.replace(".png", ".svg");
        var svgScript = $.ajax({
            type: "POST",
            url: src,
            success: function (data) {
                var svgDoc = data;
                var svg = svgDoc.documentElement;
                $detailviewSvg.append(svg);
                $ajaxloader.hide();
                $(svg).find("g>g.node>text").click(function () {
                    var className = $(this).parent().find("text:first").text();
                    var methodName = $(this).text().match(/([A-Za-z$_0-1]+)(\s+)?\(/);
                    if (methodName && methodName[1]) {
                        methodClick(className, methodName[1]);
                    }
                    else {
                        alert("The function name in the wrong format.\n" + methodName);
                    }
                }).css("cursor", "pointer")
                    .hover(function () {
                    $(this).css("text-decoration", "underline");
                }, function () {
                    $(this).css("text-decoration", "");
                });
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
        $("#buildBtnForPng").click(function () {
            build("png");
        });
        setSideView($container);
    });
}());
