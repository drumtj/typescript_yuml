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
  var extension = "svg";
  var tsData:any;

  var $detailview;
  //var $detailviewImg;
  var $detailviewSvg;
  var $codeview;
  var $ajaxloader;
  var $usecaseImg;
  var $usecaseSvg;

  tj.utils.TSParser.init();

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

  function build(ext:string="svg"){
    extension = ext;
    $("body").append($ajaxloader);
    $ajaxloader.show();
    $usecaseSvg.css({opacity: 0.5});
    //console.log(fileListView.getMergeText());
    tsData = tscodeToTsobj(fileListView.getMergeText());
    send({com:"buildUrl", script:tsobjToYUMLCode(tsData)});
  }

  //특정클래스의 멤버포함빌드용
  var tsClassData;
  

  //#151021 tj
  //이미 클래스 정보가 있는 상태에서, UML스크립트 조합만 다시해서 빌드하도록 해보자.
  //노드를 클릭하여 보는 UML을 특정 코드로만 빌드하기에는 타입정보같은 것들이 부족해서 아쉽다.
  function targetBuild(className:string):boolean{

    //tsClassData = tscodeToTsobj(tsScript, false);
    var obj;
    if( (obj = _.find(tsData.class, "name", className)) ){
      tsClassData = {
        class: [obj],
        genericList: tsData.genericList
      }
    }else if( (obj = _.find(tsData.interface, "name", className)) ){
      tsClassData = {
        interface: [obj],
        genericList: tsData.genericList
      }
    }else{
      return false;
    }

    $detailviewSvg.children().remove();
    $detailview.append($ajaxloader);
    $ajaxloader.show();

    send({com:"buildUrl2", script:tsobjToYUMLCode(tsClassData, true, false)});

    return true;
  }

  //var selectNode;
  //비동기식
  function buildUrlComplete(src:string){

    if( extension == "png" ){
      window.open(src, "_blank");
      $usecaseSvg.css({opacity: 1});
      $ajaxloader.hide();
    }else{
      src = src.replace(".png", ".svg");

      $.ajax({
  			type: "POST",
  			url: src,
  			success: function(data){
          //console.log($(data));
          var svgDoc = data;
          var svg = svgDoc.documentElement;

          $usecaseSvg.children().remove();
          $usecaseSvg.append( svg );

          $usecaseSvg.css({opacity: 1});
          $ajaxloader.hide();

          var $svg = $(svg);
          var $bindTarget;
          if( $("#memberCheck").is(":checked") ){
            $bindTarget = $svg.find("g>g.node>text").click(function(e){
              var $classNameNode = $(this).parent().find("text:first");
              var className = $classNameNode.text();
              if($(this).is($classNameNode)){
                classClick( className );
              }else{
                var methodName = $(this).text().match(/([A-Za-z$_0-1]+)(\s+)?\(/);
                if( methodName && methodName[1] ){
                  methodClick(className, methodName[1]);
                }else{
                  alert("The function name in the wrong format.\n" + methodName);
                }
              }
            });
          }else{
            $bindTarget = $svg.find("g>g.node").click(function(e){
              classClick($(this).find("text:first").text());
            });
          }

          $bindTarget.hover(function(){
            $(this).css("text-decoration", "underline");
          },function(){
            $(this).css("text-decoration", "");
          })
          .css("cursor","pointer");



          console.log(tsData);
        },
        error: function(e){
          alert(e);
        }
  		});
    }
  }

  function classClick(className:string){

      //#151021 tj
    if(targetBuild(className)){

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
  }

  function methodClick(className:string, methodName:string){
    //var nodeName = $(this).text();
    //if( nodeText.indexOf('(') > -1 ){
      //var funcName = nodeText.match(/[A-Za-z$_0-1]+/)[0];
      console.log(className, methodName);
      var classObj:any = _.find(tsData.class, "name", className);
      if( classObj ){
        //https://lodash.com/docs#find
        var methodInfo:any = _.find(classObj.method, "name", methodName);
        if(methodInfo){
          var script = ts.transpile(methodInfo.text);
          $codeview.find("xmp").html(script).removeClass("prettyprinted");//.addClass("prettyprint prettyprinted");//"prettyprint lang-js linenums prettyprinted");
          $codeview.dialog({
            open: function(){
              if( window['prettyPrint'] ) window['prettyPrint']();
            }

          });
          $codeview.dialog("option", {"width":600, "height":400});
        }else{
          alert("can not found");
        }
      }
    //}
  }



  //비동기식
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

        $(svg).find("g>g.node>text").click(function(){
          var className = $(this).parent().find("text:first").text();
          var methodName = $(this).text().match(/([A-Za-z$_0-1]+)(\s+)?\(/);
          if( methodName && methodName[1] ){
            methodClick(className, methodName[1]);
          }else{
            alert("The function name in the wrong format.\n" + methodName);
          }

        }).css("cursor","pointer")
        .hover(function(){
          $(this).css("text-decoration", "underline");
        },function(){
          $(this).css("text-decoration", "");
        });

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


  function tsobjToYUMLCode(obj:any, containMember?:boolean, relationConnect?:boolean):string{
      return tj.utils.TSParser.analysisObjectToYUMLCode(
        obj,
        typeof containMember === "undefined" ? $("#memberCheck").is(":checked") : containMember,
        typeof relationConnect === "undefined" ? !$("#onlyInheritCheck").is(":checked") : relationConnect
      );
  }

  function tscodeToYUMLCode(tsScript:string):string{
    return tsobjToYUMLCode(tscodeToTsobj(tsScript));
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
    $("#buildBtnForPng").click(function(){
      build("png");
      //alert("준비중입니당");
    });

    setSideView( $container );
  });
}());
