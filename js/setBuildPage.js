/// <reference path="./jquery/jquery.d.ts"/>
/// <reference path="./TSParser/TSParser.d.ts"/>
window.addEventListener("message", function (e) {
    console.log("window.message", e);
    var data = e.data.data;
    if (data) {
        console.log("recive", data.script);
        switch (data.com) {
            case "buildUrl":
                buildUrl2(data.script, function (src) {
                    send({ com: "buildUrlComplete", src: src });
                });
                break;
            case "buildUrl2":
                buildUrl2(data.script, function (src) {
                    send({ com: "buildUrlCompleteForTemp", src: src });
                });
                break;
        }
    }
}, false);
var justLoaded, dsl, theme, customizations, extension, type;
var buildUrl;
var $dsl;
var cleanDsl, getCustomizations, encodeURICustom;
window.onload = function () {
    $dsl = $("#dsl_text");
    customizations['scale'] = '80';
    customizations['dir'] = "RL";
    theme = 'plain';
};
var tempSrc;
function buildUrl2(yumlScript, success, error) {
    if (error === void 0) { error = null; }
    console.log("buildUrl2");
    dsl = cleanDsl(yumlScript);
    var method = 'POST';
    var template = "http://yuml.me/diagram/[THEME];[CUSTOMISATIONS]/[TYPE]/";
    var output = template.replace('[THEME]', theme);
    output = output.replace('[CUSTOMISATIONS]', getCustomizations());
    output = output.replace('[TYPE]', type);
    output = output.replace('[DSL]', dsl);
    output = output.replace(';/', '/');
    console.log(output);
    if (tempSrc != encodeURICustom(output)) {
        $.ajax({
            type: "POST",
            url: output,
            data: { dsl_text: dsl },
            success: function (data) {
                ;
                tempSrc = "http://yuml.me/" + data;
                if (success)
                    success.call(null, tempSrc);
            },
            error: function (e) {
                alert(e);
                if (error)
                    error.call(null, e);
            }
        });
    }
    else {
        if (success)
            success.call(null, tempSrc);
    }
}
function send(data) {
    window.postMessage({ to: "viewPage", data: data }, window.location.href);
}
console.log("loaded setBuildPage.js");
