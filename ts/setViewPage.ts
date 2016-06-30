/// <reference path="./jquery/jquery.d.ts"/>
///// <reference path="./chrome/chrome.d.ts"/>
/// <reference path="./TSParser/TSParser.d.ts"/>
/// <reference path="./TSFile.ts"/>
/// <reference path="./TSFileDropper.ts"/>
/// <reference path="./TSFileListView.ts"/>
/// <reference path="./SideView.ts"/>

(function(){
  var $container;
  var sideView:SideView;
  var fileDropper:TSFileDropper;
  var fileListView:TSFileListView;
  var tabInfo;
  var extensionId;
  var tsData:any;

  var $detailview;
  //var $detailviewImg;
  var $detailviewSvg;
  var $codeview;
  var $ajaxloader;
  var $usecaseImg;
  var $usecaseSvg;

  function setSideView( $parent:JQuery ){

    sideView = new SideView("400px", "100%", "rgba(200, 200, 200, 0.79)");
    $parent.append( sideView.$el );
    fileListView = new TSFileListView("100%", (window.innerHeight - 400)+"px");
    fileDropper = new TSFileDropper(fileListView, fileDropHandle);
    sideView.$el.append(fileDropper.$el);
    sideView.$el.append(fileListView.$el);

    //test
    //fileListView.add(new TSFile("test", "test"));

  }

  function fileDropHandle( tsfiles:Array<TSFile> ){
    for (let i = 0; i < tsfiles.length; i++) {
        fileListView.add( tsfiles[i] );
    }
    build();
  }

  function build(){
    $("body").append($ajaxloader);
    $ajaxloader.show();
    $usecaseSvg.css({opacity: 0.5});
    tsData = tscodeToTsobj(fileListView.getMergeText());
    send({com:"buildUrl", script:tsobjToYUMLCode(tsData)});
  }

  //특정클래스의 멤버포함빌드용
  var tsClassData;
  function build2(tsScript:string){
    //send({com:"buildUrl2", script:tsToYUMLCode(tsScript)});
    //멤버포함
    console.log("umlCode");
    $detailviewSvg.children().remove();
    $detailview.append($ajaxloader);
    $ajaxloader.show();
    tsClassData = tscodeToTsobj(tsScript, false);
    var c = tsobjToYUMLCode(tsClassData, true, false);
    console.log(c)
    send({com:"buildUrl2", script:c});

  }

  //var selectNode;
  function buildUrlComplete(src:string){


    src = src.replace(".png", ".svg");

    $.ajax({
			type: "POST",
			url: src,
			success: function(data){
        //console.log($(data));
        var svgDoc = data;
        var svg = svgDoc.documentElement;
        //var svgScript = $(svgDoc).children(":first");
        $usecaseSvg.children().remove();
        $usecaseSvg.append( svg );
        //$usecaseSvg.append( svgScript );
        $usecaseSvg.css({opacity: 1});
        $ajaxloader.hide();
        //$usecaseSvg.find("g.node").click(function(){
        $(svg).find("g>g.node").click(function(){
          var nodeName = $(this).find("text:first").text();
          //https://lodash.com/docs#find
          var selectNode:any = (_.find(tsData.class, "name", nodeName) || _.find(tsData.interface, "name", nodeName));
          if(selectNode){
            build2(selectNode.text);

            $detailview.dialog({
              close:function(event,ui){
                $detailviewSvg.children(":first").remove();
                //svg렌더가 이상해짐. 색깔이 빠짐. 다시 넣으면 정상... 왜그럴까
                $usecaseSvg.append( $usecaseSvg.children(":first") );
              }
            });
          }else{
            alert("not found");
          }
        }).css("cursor","pointer");
        console.log(tsData);
      },
      error: function(e){
        alert(e);
      }
		});
  }

  /*
  function buildUrlComplete(src:string){

    //$usecaseImg.css({opacity: 1}).attr("src", src);
    src = src.replace(".png", ".svg");
    var svgScript = $.ajax({
			type: "POST",
			url: src,
			async: false,
		}).responseText;

    $usecaseSvg.children().remove();
    $usecaseSvg.append( svgScript );
    $ajaxloader.hide();

    $usecaseSvg.find("g.node").click(function(){
      var nodeName = $(this).find("text").text();
      //https://lodash.com/docs#find
      var selectNode:any = (_.find(tsData.class, "name", nodeName) || _.find(tsData.interface, "name", nodeName));
      if(selectNode){
        build2(selectNode.text);

        $detailview.dialog({
          close:function(event,ui){
            $detailviewSvg.children(":first").remove();
            //svg렌더가 이상해짐. 색깔이 빠짐. 다시 넣으면 정상... 왜그럴까
            $usecaseSvg.append( $usecaseSvg.children(":first") );
          }
        });
      }else{
        alert("not found");
      }
    }).css("cursor","pointer");
    console.log(tsData);
  }
  */

  function buildUrlCompleteForTemp(src:string){
    //console.log("buildUrlCompleteForTemp:", src);

    src = src.replace(".png", ".svg");
    var svgScript =
    $.ajax({
			type: "POST",
			url: src,
      success: function(data){
        var svgDoc = data;
        var svg = svgDoc.documentElement;
        $detailviewSvg.append(svg);

        $ajaxloader.hide();
        console.log("tsClassData",tsClassData);

        //$detailviewSvg.find("text").click(function(){
        $(svg).find("g>g.node>text").click(function(){
          var nodeName = $(this).text();
          if( nodeName.indexOf('(') > -1 ){
            var funcName = nodeName.match(/[A-Za-z$_0-1]+/)[0];
            if( tsClassData && tsClassData.class[0] ){
              //https://lodash.com/docs#find
              var methodInfo:any = _.find(tsClassData.class[0].method, "name", funcName);
              if(methodInfo){
                $codeview.find("pre").text(ts.transpile(methodInfo.text));
                $codeview.dialog();
                $codeview.dialog("option", {"width":600, "height":400});
              }
            }
          }
        }).css("cursor","pointer");

        $detailview.dialog( "option", {
          "height": $detailviewSvg.children(":first").height() + 80,
          "width": $detailviewSvg.children(":first").width() + 50
        });
      },
      error: function(e){
        alert(e);
      }
		});
  }

  /*
  function buildUrlCompleteForTemp(src:string){
    //console.log("buildUrlCompleteForTemp:", src);
    src = src.replace(".png", ".svg");
    var svgScript = $.ajax({
			type: "POST",
			url: src,
			async: false,
		}).responseText;
    $detailviewSvg.append(svgScript);

    console.log("tsClassData",tsClassData);

    $detailviewSvg.find("text").click(function(){
      var nodeName = $(this).text();
      if( nodeName.indexOf('(') > -1 ){
        var funcName = nodeName.match(/[A-Za-z$_0-1]+/)[0];
        if( tsClassData && tsClassData.class[0] ){
          //https://lodash.com/docs#find
          var methodInfo:any = _.find(tsClassData.class[0].method, "name", funcName);
          if(methodInfo){
            $codeview.find("pre").text(ts.transpile(methodInfo.text));
            $codeview.dialog();
            $codeview.dialog("option", {"width":600, "height":400});
          }
        }
      }
    }).css("cursor","pointer");

    $detailview.dialog( "option", {
      "height": $detailviewSvg.children(":first").height() + 80,
      "width": $detailviewSvg.children(":first").width() + 50
    });
  }
  */

  function tsobjToYUMLCode(obj:any, containMember?:boolean, relationConnect?:boolean):string{
      return tj.utils.TSParser.analysisObjectToYUMLCode(
        obj,
        typeof containMember === "undefined" ? $("#memberCheck").is(":checked") : containMember,
        typeof relationConnect === "undefined" ? !$("#onlyInheritCheck").is(":checked") : relationConnect
      );
  }

  function tscodeToYUMLCode(tsScript:string):string{
    return tsobjToYUMLCode(tscodeToTsobj(tsScript));
    //fileListView.getMergeText()
    //return tj.utils.TSParser.tsToYUMLCode(fileListView.getMergeText(), $("#memberCheck").is(":checked"), $("#unknownCheck").is(":checked"), !$("#onlyInheritCheck").is(":checked"));

    /*
    if(!tsScript){
      tsData = tj.utils.TSParser.tsToAnalysisObject(fileListView.getMergeText(), $("#unknownCheck").is(":checked"));
      return tj.utils.TSParser.analysisObjectToYUMLCode(tsData, $("#memberCheck").is(":checked"), !$("#onlyInheritCheck").is(":checked"));
    }else{
      return tj.utils.TSParser.tsToYUMLCode(tsScript, $("#memberCheck").is(":checked"), $("#unknownCheck").is(":checked"), !$("#onlyInheritCheck").is(":checked"));
    }
    */
  }

  function tscodeToTsobj(tsScript:string, findUnknowObject?:boolean):any{
    return tj.utils.TSParser.tsToAnalysisObject(tsScript, (typeof findUnknowObject === "undefined" ? $("#unknownCheck").is(":checked") : findUnknowObject));
  }

  chrome.runtime.onMessage.addListener(function(message: any, sender: chrome.runtime.MessageSender, sendResponse: Function){
    //console.log("onMessage", message);
    switch( message.com ){
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

  function send( data ){
  	chrome.tabs.sendMessage( tabInfo["buildPage"].tabId, {to:"viewPage", data:data} );
  }

  $(document).ready(function(){
    console.log("init")
    $container = $("#content");
    $detailview = $("#detailview");
    $ajaxloader = $('#ajax-loader');
    $usecaseImg = $('#usecaseImg');
    //$detailviewImg = $("#detailviewImg");
    $detailviewSvg = $("#detailviewSvg");
    $codeview = $("#codeview");
    $usecaseSvg = $("#usecaseSvg");
    $("#buildBtn").click(function(){
      build();
    });

    setSideView( $container );

    //console.log(ts.transpile('getAnswerForCreateAnswerMode():string { if (this.options.createAnswerMode) { return this.createAnswerDialog.getAnswer(); } return null; })'));
    //console.log(ts.transpile('getAnswerForCreateAnswerMode();string; { if (this.options.createAnswerMode) { return this.createAnswerDialog.getAnswer(); } return null; })'));
    //console.log('getAnswerForCreateAnswerMode();string; { if (this.options.createAnswerMode) { return this.createAnswerDialog.getAnswer(); } return null; })');
  });
}());
