/// <reference path="./jquery/jquery.d.ts"/>
/// <reference path="./TSParser/TSParser.d.ts"/>

window.addEventListener("message", function(e){
  console.log("window.message", e);
  var data = e.data.data;
  if( data ){
    console.log("recive", data.script);
    switch(data.com){
      case "buildUrl":
        //build(data.script);
        //send({com:"buildUrlComplete", src:buildUrl2(data.script)});
        buildUrl2(data.script, function(src){
          send({com:"buildUrlComplete", src:src});
        });
      break;

      case "buildUrl2":
        //build(data.script);
        //send({com:"buildUrlCompleteForTemp", src:buildUrl2(data.script)});
        buildUrl2(data.script, function(src){
          send({com:"buildUrlCompleteForTemp", src:src});
        });
      break;
    }
  }
}, false);

//console.log("buildUrl",buildUrl);
var justLoaded, dsl, theme, customizations:Array<any>, extension, type;
var buildUrl:Function;
var $dsl;
var cleanDsl, getCustomizations, encodeURICustom;


window.onload = function(){
  $dsl = $("#dsl_text");
  customizations['scale'] = '80';
  customizations['dir'] = "RL";
  theme = 'plain';

  /*
  $('#usecaseImg').load(function(){
    send({com:"loadComplete", src:this.src});
  });
  */

  /*
  $tempImg = $("<img/>");
  $tempImg.load(function(){
    send({com:"loadCompleteForTemp", src:this.src});
  });
  */
};

/*
function build( yumlScript:string ){

  $dsl.val( yumlScript );
  //justLoaded = false;
  buildUrl();
}
*/

//var $tempImg;
var tempSrc;
function buildUrl2(yumlScript:string, success:Function, error:Function=null){

  console.log("buildUrl2");

  dsl = cleanDsl(yumlScript);
  var method = 'POST';

  var template = "http://yuml.me/diagram/[THEME];[CUSTOMISATIONS]/[TYPE]/";
  var output = template.replace('[THEME]',theme);
  output = output.replace('[CUSTOMISATIONS]',getCustomizations());
  output = output.replace('[TYPE]',type);
  output = output.replace('[DSL]',dsl);
  output = output.replace(';/','/');
  console.log(output)

  if( tempSrc != encodeURICustom(output)){
    $.ajax({
      type: "POST",
      url: output,
      data:{dsl_text: dsl},
      success: function(data){;
        tempSrc = "http://yuml.me/" + data;
        if(success) success.call(null, tempSrc);
      },
      error: function(e){
        alert(e);
        if(error) error.call(null,e);
      }
    })
  }else{
    if(success) success.call(null, tempSrc);
  }
}

/*
function buildUrl2(yumlScript:string):string{

  console.log("buildUrl2");

  dsl = cleanDsl(yumlScript);
  var method = 'POST';

  var template = "http://yuml.me/diagram/[THEME];[CUSTOMISATIONS]/[TYPE]/";
  var output = template.replace('[THEME]',theme);
  output = output.replace('[CUSTOMISATIONS]',getCustomizations());
  output = output.replace('[TYPE]',type);
  output = output.replace('[DSL]',dsl);
  output = output.replace(';/','/');
  console.log(output)

  if( tempSrc != encodeURICustom(output)){
    if(method=='GET'){
      tempSrc = encodeURICustom(output);
    }else{
      tempSrc = "http://yuml.me/" + $.ajax({
        type: "POST",
        url: output,
        data:{dsl_text: dsl},
        async: false,
      }).responseText;
    }
  }
  console.log("tempSrc", tempSrc);
  return tempSrc;
}
*/

function send( data ){
	window.postMessage( {to:"viewPage", data:data}, window.location.href );
}

console.log("loaded setBuildPage.js");
