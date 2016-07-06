/// <reference path="typescript/typescriptServices.d.ts"/>
module tj.utils{
  class MyLanguageServiceHost implements ts.LanguageServiceHost {
      files: { [fileName: string]: { file: ts.IScriptSnapshot; ver: number } } = {}

      log = _ => { };
      trace = _ => { };
      error = _ => { };
      //getCompilationSettings = ts.getDefaultCompilerOptions;
      getCompilationSettings;
      getScriptIsOpen = _ => true;
      getCurrentDirectory = () => "";
      getDefaultLibFileName = _ => "lib";

      getScriptVersion = fileName => this.files[fileName].ver.toString();
      getScriptSnapshot = fileName => this.files[fileName] ? this.files[fileName].file : null;

      constructor(){
        this.getCompilationSettings = ts.getDefaultCompilerOptions;
      }

      getScriptFileNames(): string[] {
          var names: string[] = [];
          for (var name in this.files) {
              if (this.files.hasOwnProperty(name)) {
                  names.push(name);
              }
          }
          return names;
      }

      addFile(fileName: string, body: string) {
          var snap = ts.ScriptSnapshot.fromString(body);
          snap.getChangeRange = _ => undefined;
          var existing = this.files[fileName];
          if (existing) {
              this.files[fileName].ver++;
              this.files[fileName].file = snap
            } else {
              this.files[fileName] = { ver: 1, file: snap };
          }
      }
  }

  class MyCompilerHost extends MyLanguageServiceHost implements ts.CompilerHost {
      getSourceFile(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
          var f = this.files[filename];
          if (!f) return null;
          var sourceFile = ts.createLanguageServiceSourceFile(filename, f.file, ts.ScriptTarget.ES5, f.ver.toString(), true);
          return sourceFile;
      }
      writeFile(filename: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void): void {
      }
      getCanonicalFileName = (fileName: string) => fileName;
      useCaseSensitiveFileNames = () => true;
      getNewLine = () => "\n";
  }

  class RelationList{
    //RegExpArrayType:RegExp = /Array＜|＞/g;
    regDefaultArrayType:RegExp = /＜([A-za-z_\$]+)＞/;
    get length():number{
      return this.relation.length;
    }
    set length(n:number){
      this.relation.length = n;
    }
    relation:Array<string> = [];
    exceptList:any;
    constructor(exceptList?:any){
      if( exceptList ){
        this.exceptList = JSON.parse(JSON.stringify(exceptList));
        //console.log("this.exceptList", this.exceptList);
      }else{
        this.exceptList = {};
      }
    }

    addExceptionName(name:string){
      //console.log("addExceptionName",name);
      if( name ) this.exceptList[name] = 0;
    }

    add( str:string ){
      if( typeof this.exceptList[str] !== "undefined" ) return;
      if( !TSParser.isDefaultType(str)){
        //배열이면 그 구성원을 구함. 연결을 위한 판단이기 때문. 배열임은 중요치않다.
        if( str.indexOf('［') > -1 ){
          str = str.replace(/［］/g, '');
        }

        //Array<string> 이런놈들은 여기로 오겠지. 하지만 이런애들은 연결관계를 표현할 놈들이 아니야
        if( str.indexOf('＜') > -1 ){
           var m = str.match(this.regDefaultArrayType);
           //console.log(11111, str, m);
           if(m) str = m.pop();
           else return;
        }

        //알맹이만 빼서 다시 검사
        if( str != "Function" && !TSParser.isDefaultType(str) &&  str != "RegExp" ){
          this.relation.push( str );
        }
      }
    }

    reset(){
      this.relation.length = 0;
      this.exceptList = {};
    }

    getList():Array<string>{
      var a = this.relation;
      this.relation = [];
      return a;
    }

    repetitionRemoval(){
      //중복제거
      this.relation.sort();
      for (let i = 0; i < this.relation.length-1; i++) {
          if( this.relation[i] == this.relation[i+1] ) this.relation.splice(i,1);
      }
    }
  }

  /*
  interface TSInfo{
    name:string;
    type:string;
    modifier:string;
    method:Array;
    property:
  }
  */

  export class TSParser {
    // static host:MyCompilerHost = new MyCompilerHost();
    // static languageService:ts.LanguageService = ts.createLanguageService(TSParser.host, ts.createDocumentRegistry());
    static host:MyCompilerHost;
    static languageService:ts.LanguageService;
    static dummyScriptName:string = "script.ts";
    static Reg_startArray:RegExp = /Array＜/;
    static STR_CLASS:string = "class";
    static STR_INTERFACE:string = "interface";
    static STR_METHOD:string = "method";
    static STR_PROPERTY:string = "property";
    static STR_UNDEFINED:string = "undefined";
    static STR_STATIC:string = "static";
    static STR_COLOR_CLASS:string = "{bg:lightblue}";
    static STR_COLOR_INTERFACE:string = "{bg:wheat}";
    static defaultTypeList:Array<string> = ["string", "void", "any", "boolean", "number"];//, "Regexp", "Function"];


    static init() {
      TSParser.host = new MyCompilerHost();
      TSParser.languageService = ts.createLanguageService(TSParser.host, ts.createDocumentRegistry());
    }


    static getKindModifiersChar( kindModifiers:string ):string{
      //console.log(kindModifiers);
      switch( kindModifiers ){
        case "":
        case "public": return '＋';
        case "static":
        case "public,static": return '±';
        case "private": return '－';
        case "protected": return '#';
        default: return "";
      }
    }

    static getSymbolTypeOfFlag( flag:number ):string{
      switch( flag ){
        case ts.SymbolFlags.Optional:
        case 536870916:
        case ts.SymbolFlags.Property: return TSParser.STR_PROPERTY;//"property";
        case ts.SymbolFlags.Method: return TSParser.STR_METHOD;//'method';
        case ts.SymbolFlags.Interface: return TSParser.STR_INTERFACE;//'interface';
        case ts.SymbolFlags.Class: return TSParser.STR_CLASS;//'class';
        default: return null;
      }
    }

    static isInterface(data:any, name:string):boolean{
      if(!data.interface) return false;
      for (let i = 0; i < data.interface.length; i++) {
          if( data.interface[i].name == name ) return true;
      }
      return false;
    }

    static isClass(data:any, name:string):boolean{
      if(!data.class) return false;
      for (let i = 0; i < data.class.length; i++) {
          if( data.class[i].name == name ) return true;
      }
      return false;
    }

    static isDefaultType(typename:string):boolean{
      /*
      var list = ["string", "void", "any","boolean", "number", "array"];
      var list2 = ["string[", "any[","boolean[", "number[", "array<"];
      if( typeof typename !== "string" ) return false;
      var a:string[];
      //typename = typename.toLowerCase();
      for (let i = 0; i < list.length; i++) {
        if( typename == list[i] ) return true;
      }
      for (let i = 0; i < list2.length; i++) {
        if( typename.substr(0, list2[i].length) == list2[i] ) return true;
      }
      //console.log("true.....");
      return false;
      */
      if( typeof typename !== "string" ) return false;
      var list = TSParser.defaultTypeList;

      //배열은 default가 아닌걸로
      if( TSParser.Reg_startArray.test(typename) ) return false;
      if( typename.indexOf("[]") > -1 || typename.indexOf("［］") > -1 ) return false;
      typename = typename.toLowerCase();
      for (let i = 0; i < list.length; i++) {
        if( typename == list[i] ) return true;
      }
      return false;
    }

    static getTypeString(typeChecker:ts.TypeChecker, type:ts.Type, symbol?:ts.Symbol):string{
      var str = typeChecker.typeToString( type );
      //console.log("type:",type, "str:",str, "symbol:",symbol);
      //console.log("typeToString", str);
      if( str.indexOf("{") > -1 ) return "any";
      //if( str == "{}" ) return "any";
      if( str.charAt(0) == "(" ) return "Function";

      //console.log(symbol);

      if( symbol && str == "any" && symbol["valueDeclaration"] && symbol["valueDeclaration"]["type"] ){
        //정의되지 않은 속성은 type을 뽑아보면 "any"로 되어있다.
        //TSParser.isDefaultType함수로 인정되지 않는 것들은 커스텀한 객체(class, interface)라 가정하고
        //type을 type원본 문자열을 찾아서 넣어주자, 그러면 로직상.. relation목록에 추가될테니 객체가 그려질것이다.
        //(TSParser.isDefaultType함수에서 Array<MyClass>같은 형태도 올 수 있으니 보정하자)

        str = ts.getTextOfNode(symbol["valueDeclaration"]["type"]);
        //console.log("symbol.valueDeclaration.type", str);
        //console.log(ts.isFunctionLike(symbol["valueDeclaration"]["type"]));
        if( str == "Object") return "any";

        //return str;
      }
      //typeChecker.typeToString( type );
      //console.log(str);
      if( str.indexOf('|') > -1 ){
        return "any";
      }

      if( str.indexOf('<') > -1 ){
        str = str.replace(/</g,"＜").replace(/>/g,"＞");
      }
      if( str.indexOf(',') > -1 ){
        str = str.replace(/,/g,'，');
      }
      if( str.indexOf('[') > -1 ){
        str = str.replace(/\[/g,"［").replace(/\]/g,"］");
      }
      if( str.indexOf('{') > -1 ){
        str = str.replace(/\{/g,"｛").replace(/\}/g,"｝");
      }

      //console.log("return type", str);
      return str;
    }

    static getParameterInfo(typeChecker:ts.TypeChecker, st:ts.Signature, findUnknownType:boolean=false):Array<any>{
      var params = st.getParameters();
      var plist = [];
      var node:ts.Node;
      var stype:ts.Type;
      for (let p in params) {
          node = params[p].getDeclarations()[0];
          stype = typeChecker.getTypeAtLocation(node);
          plist.push({
            name: ts.getDeclaredName(typeChecker, params[p], node),
            type: TSParser.getTypeString(typeChecker, stype, (findUnknownType ? params[p] : null))
          });
      }
      return plist;
    }

    static getNodeModifiers( node:ts.Node ):string{
      var modifier = ts.getNodeModifiers( node );
      if( modifier == "" ) modifier = "public";
      return modifier;
    }

    /*
    interface Symbol {
        getFlags(): SymbolFlags;
        getName(): string;
        getDeclarations(): Declaration[];
        getDocumentationComment(): SymbolDisplayPart[];
    }
    interface Type {
        getFlags(): TypeFlags;
        getSymbol(): Symbol;
        getProperties(): Symbol[];
        getProperty(propertyName: string): Symbol;
        getApparentProperties(): Symbol[];
        getCallSignatures(): Signature[];
        getConstructSignatures(): Signature[];
        getStringIndexType(): Type;
        getNumberIndexType(): Type;
    }
    interface Signature {
        getDeclaration(): SignatureDeclaration;
        getTypeParameters(): Type[];
        getParameters(): Symbol[];
        getReturnType(): Type;
        getDocumentationComment(): SymbolDisplayPart[];
    }
    */


    static tsToAnalysisObject(text:string, findUnknownObject:boolean=true):any{
      //////////////////////////////////////////// getting import list for AMD format //////////////////////////
      /////amd스타일의 코드에서 import, export부분을 주석처리하고,
      //import하는 클래스이름을 연관관계에 추가하자
      //"import Inst =  require('global/Inst')" 이걸로 테스트해보라.  주석처리되지않은 import 구문에서 require한 클래스 이름을 가져온다.
      var importList;
      if( text.indexOf("/*eof*/") > -1 ){
        var expImportList = /(^|\n)(\s+)?import (\s+)?[\w\d\$\_]+(\s+)?\=(\s+)?require\((\s+)?(\'([\w\d\/\$\_\.\-]+)\'|\"([\w\d\/\$\_\.\-]+)\")(\s+)?\)/g;
        var expRequirePath = /(\'([\w\d\/\$\_\.\-]+)\'|\"([\w\d\/\$\_\.\-]+)\")/;
        var expExportName = /\n(\s+)?export(\s+)?\=(\s+)?([\w\d\$\_]+)/;
        var classTexts = text.split("/*eof*/");
        var exportName, exportMatch;
        var importMatch, tempArr;
        importList = {};
        classTexts.pop();

        for (let i = 0; i < classTexts.length; i++) {
          //console.log(classTexts[i]);
          //console.log("----------------");
          exportMatch = classTexts[i].match(expExportName);
          if( exportMatch ){
            exportName = exportMatch.pop();
            importList[exportName] = importList[exportName] || {};
            importMatch = classTexts[i].match(expImportList);
            if( importMatch ){
              importList[exportName] = {};
              for (let i = 0; i < importMatch.length; i++) {
                tempArr = importMatch[i].match(expRequirePath);
                //배열이 4짜리가 나온다, 2,3번 인덱스에 ''이걸로 감싼 문자열이나 ""이걸로 감싼 문자열이 올 것이니 둘중 하나로 쓰도록.
                //경로의 문자열에서 끝부분만 떼어내야 클래스 이름. split처리
                if( tempArr ){
                  importList[exportName][ (tempArr.pop() || tempArr.pop()).split('/').pop() ] = 1;
                }
              }
            }
          }
        }
        console.log("importList", importList);
      }
      //import, export 구문때문에 여러개 파일의 소스를 하나로 합쳐서 분석할때 오작동.  주석처리해주자.
      text = text.replace(/^(\s+)?import\s/g,"//import ").replace(/\n(\s+)?import\s/g,"//import ").replace(/\n(\s+)?export\s?\=/g,"//export=");
      ///////////////////////////////////////////////////////////////////////////////////////////




      TSParser.host.addFile(TSParser.dummyScriptName, text);
      var program:ts.Program = ts.createProgram([TSParser.dummyScriptName], TSParser.host.getCompilationSettings(), TSParser.host);
      var typeChecker:ts.TypeChecker = program.getTypeChecker();
      var sf:ts.SourceFile = program.getSourceFile(TSParser.dummyScriptName);

      var decls:ts.Map<ts.Declaration[]> = sf.getNamedDeclarations();
      var nd:ts.Node;
      var symbol:ts.Symbol;
      var symbols:Array<ts.Symbol>;

      var data:any = {};
      var k,l,nd2,nd3,ty2,ty3;
      var expList;
      var classObj;
      var type;
      var typeStr;
      var name;
      var st;
      var modifier;
      var implementList;
      var exp_implementList = /implements (\w+)\,?\s?(\w+)?\,?\s?(\w+)?{/;

      var methodGenericMatch;
      var exp_generic = /<(\w+)( extends )?(\w+)?>/;
      var propertyInfo, methodInfo;
      var genericList = {};
      var typeName, txtOfNode;

      for (let key in decls) {
        for (let key1 in decls[key]) {
          nd = decls[key][key1];

          type = typeChecker.getTypeAtLocation(nd);

          name = ts.getDeclaredName(typeChecker, nd.symbol, nd);
          k = TSParser.getSymbolTypeOfFlag( nd.symbol.flags );
          if( k == null ) continue;

          modifier = TSParser.getNodeModifiers(nd);
          //console.log(k);
          if( k == TSParser.STR_CLASS || k == TSParser.STR_INTERFACE ){
            if( typeof data[k] === TSParser.STR_UNDEFINED ) data[k] = [];

            classObj = {
              name:name,
              type:TSParser.getTypeString(typeChecker, type),
              modifier:modifier,
              text: ts.getTextOfNode(nd)
            };

            methodGenericMatch = classObj.text.substr(0,classObj.text.indexOf('{')).match(exp_generic);
            //console.log(methodGenericMatch);
            if( methodGenericMatch ){
              genericList[methodGenericMatch[1]] = 0;
            }
            //console.log(nd.symbol.name, typeStr);
            //console.log(nd.symbol);
            //상속으로 연결된 클래스 찾기
            expList = [];
            if( typeof nd["heritageClauses"] !== TSParser.STR_UNDEFINED ){
              let hnd = nd["heritageClauses"][0];
              //console.log(hnd);
              //console.log("getExternalModuleName", ts.getExternalModuleName(hnd.types[0]));
              let expressNode;
              let expNameArr = [];
              for (let r=0; r<hnd.types.length; r++) {
                expressNode = ts.getEntityNameFromTypeNode(hnd.types[r]);

                //console.log("isClassLike", ts.isClassLike(expressNode));
                //console.log("expressNode", expressNode);
                if( expressNode ){
                  //if( expressNode.expression ) expNameArr.push(expressNode.expression.text);
                  if( expressNode.name ) expNameArr.push(expressNode.name.text);
                  else if( expressNode.text ) expNameArr.push(expressNode.text);
                }
                //console.log("expressNode",expressNode,expNameArr);
                expressNode = null;
                expList.push( expNameArr.join('.') );
                expNameArr.length = 0;
              }
            }

            //#151019 tj
            //////extends 이후 implements에 대한 누락때문에 여기서 코드text를 직접 판단해서 추가////
            var impList = [];
            //implements 3개까지 확인
            implementList = classObj.text.match(exp_implementList);
            //console.log( implementList );
            if( implementList ){
              implementList.shift();
              for (let o=0; o<implementList.length; o++) {
                if( implementList[o] ){
                  impList.push( implementList[o] );
                }
              }
            }
            /////////////////////////////////////////////////////////////////////////////////////

            //console.log("expList",expList)

            classObj.super = expList;
            classObj.implements = impList;

            data[k].push(classObj);

            /////멤버 확인

            nd2 = nd.symbol.getDeclarations()[0];
            ty2 = typeChecker.getTypeAtLocation(nd2);
            symbols = ty2.getProperties();

            for (let key2 in symbols) {
              symbol = symbols[key2];
              l = TSParser.getSymbolTypeOfFlag( symbol.flags );

              if( l == null ) continue;
              if( typeof classObj[l] === TSParser.STR_UNDEFINED ) classObj[l] = [];

              nd3 = symbol.getDeclarations()[0];
              ty3 = typeChecker.getTypeAtLocation(nd3);



              //console.log(name,"-",symbol.name);
              if( l == TSParser.STR_PROPERTY ){

                typeName = null;
                txtOfNode = ts.getTextOfNode(nd3);
                if(symbol["valueDeclaration"] && symbol["valueDeclaration"]["type"]){
                  typeName = ts.getTextOfNode(symbol["valueDeclaration"]["type"]);
                  if( txtOfNode.indexOf("[]") > -1 ) {
                    typeName = typeName.replace(/\[\]/g, "［］");
                  } else if( txtOfNode.indexOf("Array") > -1 ){
                    typeName = typeName.replace(/\</g, "〈").replace(/\>/g, "〉");
                  }else{
                    typeName = null;
                  }
                }

                propertyInfo = {
                  name:ts.getDeclaredName(typeChecker, symbol, nd3),
                  //type:typeChecker.typeToString(ty3),
                  //type: TSParser.getTypeString(typeChecker, ty3),
                  //끝에 symbol인자를 넘기면 정의되지 않은 타입의 반환값이 any로 넘어오는것을 실제 타입이름으로 대체
                  //type: TSParser.getTypeString(typeChecker, ty3, (findUnknownObject ? symbol : null)),
                  type: typeName ? typeName : TSParser.getTypeString(typeChecker, ty3, (findUnknownObject ? symbol : null)),
                  modifier: TSParser.getNodeModifiers(nd3)
                };
                //console.log();
                //console.log(propertyInfo.name, propertyInfo.type, ts.getTextOfNode(nd3));
                classObj[l].push(propertyInfo);
              }else if( l == TSParser.STR_METHOD ){
                st = ty3.getCallSignatures()[0];

                //console.log(ts.getDeclaredName(typeChecker, symbol, nd3), typeChecker.typeToString(st.getReturnType()), TSParser.getTypeString(typeChecker, st.getReturnType(), (findUnknownObject ? symbol : null)))
                methodInfo = {
                  name:ts.getDeclaredName(typeChecker, symbol, nd3),
                  type: TSParser.getTypeString(typeChecker, st.getReturnType(), (findUnknownObject ? symbol : null)),
                  modifier: TSParser.getNodeModifiers(nd3),
                  parameters: TSParser.getParameterInfo(typeChecker, st, findUnknownObject),
                  text: ts.getTextOfNode(nd3)
                };


                //제네릭클래스는 이름이 같을 경우가 있기때문에.. UML에 표시하지 말자.
                //연관관계에서 제외할 목록 정리
                methodGenericMatch = methodInfo.text.substr(0, methodInfo.text.indexOf('{')).match(exp_generic);
                //console.log(methodGenericMatch);
                if( methodGenericMatch ){
                  genericList[methodGenericMatch[1]] = 0;
                  //methodGenericMatch[0] : 제네릭클래스 이름
                  //methodGenericMatch[2] : 제네릭 상위클래스 이름
                  //genericClassList 제네릭클래스 목록에 추가
                  //if( typeof genericClassList[methodGenericMatch[0]] === "undefined" )
                  //if( typeof methodGenericMatch[2] === "undefined" ){

                  //}
                }
                classObj[l].push(methodInfo);
                //console.log(name, classObj[l]);
              }
            }
          }//end if
          else if( modifier == TSParser.STR_STATIC ){

            //객체와 포함멤버 순으로 정렬된 리스트를 순회하기 때문에 이시점(static이 나온)에서는 classObj가 현재 static멤버가 속한 객체다.
            //console.log(nd.symbol.flags, modifier);
            var lo = TSParser.getSymbolTypeOfFlag( nd.symbol.flags );
            if( typeof classObj[lo] === TSParser.STR_UNDEFINED ) classObj[lo] = [];
            if( lo == TSParser.STR_PROPERTY ){
              classObj[lo].push({
                name:ts.getDeclaredName(typeChecker, nd.symbol, nd),
                //끝에 symbol인자를 넘기면 정의되지 않은 타입의 반환값이 any로 넘어오는것을 실제 타입이름으로 대체
                type: TSParser.getTypeString(typeChecker, type, (findUnknownObject ? nd.symbol : null)),
                modifier: modifier
              });
            }else if( lo == TSParser.STR_METHOD ){
              st = type.getCallSignatures()[0];

              var static_method_info = {
                name:ts.getDeclaredName(typeChecker, nd.symbol, nd),
                type: TSParser.getTypeString(typeChecker, st.getReturnType(), (findUnknownObject ? nd.symbol : null)),
                modifier:modifier,
                parameters: TSParser.getParameterInfo(typeChecker, st, findUnknownObject),
                text: ts.getTextOfNode(nd)
              };

              methodGenericMatch = static_method_info.text.substr(0,static_method_info.text.indexOf('{')).match(exp_generic);
              //console.log(methodGenericMatch);
              if( methodGenericMatch ){
                genericList[methodGenericMatch[1]] = 0;
              }

              classObj[lo].push(static_method_info);
            }
            lo = null;
          }

        }//end for
      }//end for

      //data.class = null;
      //
      data.genericList = genericList;
      data.importList = importList;

      return data;
    }

    static analysisObjectToYUMLCode(data:any, containMembers:boolean=true, relationConnect:boolean=true):string{

      var list:Array<string> = [];
      var temp:Array<string> = [];
      var dclass;
      var dinter;
      var p,m,args;
      //관계에서 예외시킬 리스트, 오브젝트형으로 전달.
      var relation:RelationList = new RelationList(data.genericList);


      //console.log(data.genericList);
      //정의
      list.push("//define");
      if( data.class ){
        for (let o in data.class) {
          dclass = data.class[o];
          relation.addExceptionName( dclass.name );

          //amd형식의 import로 연관있는 대상이 있다면
          if(data.importList && data.importList[dclass.name]){
            for (let key in data.importList[dclass.name]) {
              relation.add( key );
            }
          }

          p = dclass.property;
          m = dclass.method;

          temp.length = 0;
          temp.push("[" + dclass.name );

          if(p){
            if(containMembers){
              temp.push("|");
              for (let i = 0,li=p.length; i < li; i++) {
                if( i > 0 ) temp.push(";");
                temp.push(TSParser.getKindModifiersChar( p[i].modifier ) + p[i].name + ":" + p[i].type);
                //연관 객체 정리
                relation.add(p[i].type);
              }
            }else{
              //연관 객체 정리
              for (let i = 0,li=p.length; i < li; i++) {
                //console.log(p[i].type);
                relation.add(p[i].type);
              }
            }
          }
          if(m){
            if(containMembers){
              temp.push("|");
              for (let i = 0,li=m.length; i < li; i++) {
                if( i > 0 ) temp.push(";");
                temp.push(TSParser.getKindModifiersChar( m[i].modifier ) + m[i].name + "(");
                //console.log(m[i].name);
                //console.log(m[i].parameters);
                //console.log(m[i].parameters, m[i].parameters.length);
                for (let j = 0,lj=m[i].parameters.length; j < lj; j++) {
                    if( j > 0 ) temp.push("，");
                    //console.log(m[i].parameters[j].name + ":" + m[i].parameters[j].type)
                    temp.push( m[i].parameters[j].name + ":" + m[i].parameters[j].type );
                    //연관 객체 정리
                    relation.add(m[i].parameters[j].type);
                }
                temp.push("):" + m[i].type);
                //연관 객체 정리
                relation.add(m[i].type);
              }
            }else{
              //연관 객체 정리
              for (let i = 0,li=m.length; i < li; i++) {
                for (let j = 0,lj=m[i].parameters.length; j < lj; j++) {
                  relation.add(m[i].parameters[j].type);
                }
                relation.add(m[i].type);
              }
            }
          }

          temp.push("]");
          list.push(temp.join(''));

          if( relation.length > 0 ){
            //중복제거
            relation.repetitionRemoval();
            dclass.relation = relation.getList();
          }
          relation.reset();
        }
      }

      if( data.interface ){
        for (let o in data.interface) {
          dinter = data.interface[o];
          relation.addExceptionName( dinter.name );

          p = dinter.property;
          m = dinter.method;

          temp.length = 0;
          temp.push("[" + dinter.name );

          if(p){


            if(containMembers){
              temp.push("|");
              for (let i = 0,li=p.length; i < li; i++) {
                if( i > 0 ) temp.push(";");
                temp.push(TSParser.getKindModifiersChar( p[i].modifier ) + p[i].name + ":" + p[i].type);
                //연관 객체 정리
                relation.add( p[i].type );
              }
            }else{
              for (let i = 0,li=p.length; i < li; i++) {
                //연관 객체 정리
                relation.add( p[i].type );
              }
            }
          }
          if(m){
            if(containMembers){
              temp.push("|");
              for (let i = 0,li=m.length; i < li; i++) {
                if( i > 0 ) temp.push(";");
                temp.push(TSParser.getKindModifiersChar( m[i].modifier ) + m[i].name + "(");
                for (let j = 0,lj=m[i].parameters.length; j < lj; j++) {
                    if( j > 0 ) temp.push("，");
                    temp.push( m[i].parameters[j].name + ":" + m[i].parameters[j].type );
                    //연관 객체 정리
                    relation.add( m[i].parameters[j].type );
                }
                temp.push("):" + m[i].type);
                //연관 객체 정리
                relation.add( m[i].type );
              }
            }else{
              for (let i = 0,li=m.length; i < li; i++) {
                for (let j = 0,lj=m[i].parameters.length; j < lj; j++) {
                    //연관 객체 정리
                    relation.add( m[i].parameters[j].type );
                }
                //연관 객체 정리
                relation.add( m[i].type );
              }
            }
          }

          temp.push("]");
          list.push(temp.join(''));

          if( relation.length > 0 ){
            //중복제거
            relation.repetitionRemoval();
            dinter.relation = relation.getList();
          }
          relation.reset();
        }
      }

      //색
      list.push("//color");
      if( data.class ){
        for (let o in data.class) {
          list.push("[" + data.class[o].name + TSParser.STR_COLOR_CLASS + "]");
        }
      }

      if( data.interface ){
        for (let o in data.interface) {
          list.push("[" + data.interface[o].name + TSParser.STR_COLOR_INTERFACE + "]");
        }
      }


      //관계
      list.push("//relation");
      if( data.class ){
        for (let o in data.class) {
          dclass = data.class[o];
          for (let oo in dclass.super) {
            temp.length = 0;
            temp.push("[" + dclass.super[oo] + "]");
            //class의 super리스트에 interface가있으면 구현관계
            if( TSParser.isInterface(data, dclass.super[oo]) ){
              //temp.push("^-.-");
              dclass.implements.push(dclass.super.splice(oo,1)[0]);
            }else{
              temp.push("^");
            }
            temp.push("[" + dclass.name + "]");
            list.push(temp.join(''));
          }

          //#151021 tj
          for (let ooo in dclass.implements){
            list.push( "[" + dclass.implements[ooo] + "]^-.-" + "[" + dclass.name + "]" );
          }

          if( dclass.relation && relationConnect ){
            for (let oo in dclass.relation) {
              list.push("[" + dclass.relation[oo] + "]-[" + dclass.name + "]");
            }
          }


        }
      }

      if( data.interface ){
        for (let o in data.interface) {
          dinter = data.interface[o];
          for (let oo in dinter.super) {
            //일반화(상속)
            list.push("[" + dinter.super[oo] + "]^[" + dinter.name + "]");
          }

          if( dinter.relation && relationConnect ){
            for (let oo in dinter.relation) {
              list.push("[" + dinter.relation[oo] + "]-[" + dinter.name + "]");
            }
          }


        }
      }

      //중복된 연결문법 제거
      //console.log("list:", list);
      for (let i=0; i<list.length; i++) {
        list[i] = list[i].split("-").sort().join("-");
      }

      var tempStr;
      for (let i=0; i<list.length; i++) {
        tempStr = list[i];
        for (let j=i+1; j<list.length; j++) {
          if( list[j] == tempStr ){
            list.splice(j,1);
            j--;
          }
        }
      }

      return list.join('\n');
    }

    static tsToYUMLCode(text:string, containMembers:boolean=true, findUnknownObject:boolean=true, relationConnect:boolean=true):string{
      return TSParser.analysisObjectToYUMLCode(TSParser.tsToAnalysisObject(text, findUnknownObject), containMembers, relationConnect);
    }
  }
}
