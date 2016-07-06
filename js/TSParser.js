var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tj;
(function (tj) {
    var utils;
    (function (utils) {
        var MyLanguageServiceHost = (function () {
            function MyLanguageServiceHost() {
                var _this = this;
                this.files = {};
                this.log = function (_) { };
                this.trace = function (_) { };
                this.error = function (_) { };
                this.getScriptIsOpen = function (_) { return true; };
                this.getCurrentDirectory = function () { return ""; };
                this.getDefaultLibFileName = function (_) { return "lib"; };
                this.getScriptVersion = function (fileName) { return _this.files[fileName].ver.toString(); };
                this.getScriptSnapshot = function (fileName) { return _this.files[fileName] ? _this.files[fileName].file : null; };
                this.getCompilationSettings = ts.getDefaultCompilerOptions;
            }
            MyLanguageServiceHost.prototype.getScriptFileNames = function () {
                var names = [];
                for (var name in this.files) {
                    if (this.files.hasOwnProperty(name)) {
                        names.push(name);
                    }
                }
                return names;
            };
            MyLanguageServiceHost.prototype.addFile = function (fileName, body) {
                var snap = ts.ScriptSnapshot.fromString(body);
                snap.getChangeRange = function (_) { return undefined; };
                var existing = this.files[fileName];
                if (existing) {
                    this.files[fileName].ver++;
                    this.files[fileName].file = snap;
                }
                else {
                    this.files[fileName] = { ver: 1, file: snap };
                }
            };
            return MyLanguageServiceHost;
        }());
        var MyCompilerHost = (function (_super) {
            __extends(MyCompilerHost, _super);
            function MyCompilerHost() {
                _super.apply(this, arguments);
                this.getCanonicalFileName = function (fileName) { return fileName; };
                this.useCaseSensitiveFileNames = function () { return true; };
                this.getNewLine = function () { return "\n"; };
            }
            MyCompilerHost.prototype.getSourceFile = function (filename, languageVersion, onError) {
                var f = this.files[filename];
                if (!f)
                    return null;
                var sourceFile = ts.createLanguageServiceSourceFile(filename, f.file, 1, f.ver.toString(), true);
                return sourceFile;
            };
            MyCompilerHost.prototype.writeFile = function (filename, data, writeByteOrderMark, onError) {
            };
            return MyCompilerHost;
        }(MyLanguageServiceHost));
        var RelationList = (function () {
            function RelationList(exceptList) {
                this.regDefaultArrayType = /＜([A-za-z_\$]+)＞/;
                this.relation = [];
                if (exceptList) {
                    this.exceptList = JSON.parse(JSON.stringify(exceptList));
                }
                else {
                    this.exceptList = {};
                }
            }
            Object.defineProperty(RelationList.prototype, "length", {
                get: function () {
                    return this.relation.length;
                },
                set: function (n) {
                    this.relation.length = n;
                },
                enumerable: true,
                configurable: true
            });
            RelationList.prototype.addExceptionName = function (name) {
                if (name)
                    this.exceptList[name] = 0;
            };
            RelationList.prototype.add = function (str) {
                if (typeof this.exceptList[str] !== "undefined")
                    return;
                if (!TSParser.isDefaultType(str)) {
                    if (str.indexOf('［') > -1) {
                        str = str.replace(/［］/g, '');
                    }
                    if (str.indexOf('＜') > -1) {
                        var m = str.match(this.regDefaultArrayType);
                        if (m)
                            str = m.pop();
                        else
                            return;
                    }
                    if (str != "Function" && !TSParser.isDefaultType(str) && str != "RegExp") {
                        this.relation.push(str);
                    }
                }
            };
            RelationList.prototype.reset = function () {
                this.relation.length = 0;
                this.exceptList = {};
            };
            RelationList.prototype.getList = function () {
                var a = this.relation;
                this.relation = [];
                return a;
            };
            RelationList.prototype.repetitionRemoval = function () {
                this.relation.sort();
                for (var i = 0; i < this.relation.length - 1; i++) {
                    if (this.relation[i] == this.relation[i + 1])
                        this.relation.splice(i, 1);
                }
            };
            return RelationList;
        }());
        var TSParser = (function () {
            function TSParser() {
            }
            TSParser.init = function () {
                TSParser.host = new MyCompilerHost();
                TSParser.languageService = ts.createLanguageService(TSParser.host, ts.createDocumentRegistry());
            };
            TSParser.getKindModifiersChar = function (kindModifiers) {
                switch (kindModifiers) {
                    case "":
                    case "public": return '＋';
                    case "static":
                    case "public,static": return '±';
                    case "private": return '－';
                    case "protected": return '#';
                    default: return "";
                }
            };
            TSParser.getSymbolTypeOfFlag = function (flag) {
                switch (flag) {
                    case 536870912:
                    case 536870916:
                    case 4: return TSParser.STR_PROPERTY;
                    case 8192: return TSParser.STR_METHOD;
                    case 64: return TSParser.STR_INTERFACE;
                    case 32: return TSParser.STR_CLASS;
                    default: return null;
                }
            };
            TSParser.isInterface = function (data, name) {
                if (!data.interface)
                    return false;
                for (var i = 0; i < data.interface.length; i++) {
                    if (data.interface[i].name == name)
                        return true;
                }
                return false;
            };
            TSParser.isClass = function (data, name) {
                if (!data.class)
                    return false;
                for (var i = 0; i < data.class.length; i++) {
                    if (data.class[i].name == name)
                        return true;
                }
                return false;
            };
            TSParser.isDefaultType = function (typename) {
                if (typeof typename !== "string")
                    return false;
                var list = TSParser.defaultTypeList;
                if (TSParser.Reg_startArray.test(typename))
                    return false;
                if (typename.indexOf("[]") > -1 || typename.indexOf("［］") > -1)
                    return false;
                typename = typename.toLowerCase();
                for (var i = 0; i < list.length; i++) {
                    if (typename == list[i])
                        return true;
                }
                return false;
            };
            TSParser.getTypeString = function (typeChecker, type, symbol) {
                var str = typeChecker.typeToString(type);
                if (str.indexOf("{") > -1)
                    return "any";
                if (str.charAt(0) == "(")
                    return "Function";
                if (symbol && str == "any" && symbol["valueDeclaration"] && symbol["valueDeclaration"]["type"]) {
                    str = ts.getTextOfNode(symbol["valueDeclaration"]["type"]);
                    if (str == "Object")
                        return "any";
                }
                if (str.indexOf('|') > -1) {
                    return "any";
                }
                if (str.indexOf('<') > -1) {
                    str = str.replace(/</g, "＜").replace(/>/g, "＞");
                }
                if (str.indexOf(',') > -1) {
                    str = str.replace(/,/g, '，');
                }
                if (str.indexOf('[') > -1) {
                    str = str.replace(/\[/g, "［").replace(/\]/g, "］");
                }
                if (str.indexOf('{') > -1) {
                    str = str.replace(/\{/g, "｛").replace(/\}/g, "｝");
                }
                return str;
            };
            TSParser.getParameterInfo = function (typeChecker, st, findUnknownType) {
                if (findUnknownType === void 0) { findUnknownType = false; }
                var params = st.getParameters();
                var plist = [];
                var node;
                var stype;
                for (var p in params) {
                    node = params[p].getDeclarations()[0];
                    stype = typeChecker.getTypeAtLocation(node);
                    plist.push({
                        name: ts.getDeclaredName(typeChecker, params[p], node),
                        type: TSParser.getTypeString(typeChecker, stype, (findUnknownType ? params[p] : null))
                    });
                }
                return plist;
            };
            TSParser.getNodeModifiers = function (node) {
                var modifier = ts.getNodeModifiers(node);
                if (modifier == "")
                    modifier = "public";
                return modifier;
            };
            TSParser.tsToAnalysisObject = function (text, findUnknownObject) {
                if (findUnknownObject === void 0) { findUnknownObject = true; }
                var importList;
                if (text.indexOf("/*eof*/") > -1) {
                    var expImportList = /(^|\n)(\s+)?import (\s+)?[\w\d\$\_]+(\s+)?\=(\s+)?require\((\s+)?(\'([\w\d\/\$\_\.\-]+)\'|\"([\w\d\/\$\_\.\-]+)\")(\s+)?\)/g;
                    var expRequirePath = /(\'([\w\d\/\$\_\.\-]+)\'|\"([\w\d\/\$\_\.\-]+)\")/;
                    var expExportName = /\n(\s+)?export(\s+)?\=(\s+)?([\w\d\$\_]+)/;
                    var classTexts = text.split("/*eof*/");
                    var exportName, exportMatch;
                    var importMatch, tempArr;
                    importList = {};
                    classTexts.pop();
                    for (var i = 0; i < classTexts.length; i++) {
                        exportMatch = classTexts[i].match(expExportName);
                        if (exportMatch) {
                            exportName = exportMatch.pop();
                            importList[exportName] = importList[exportName] || {};
                            importMatch = classTexts[i].match(expImportList);
                            if (importMatch) {
                                importList[exportName] = {};
                                for (var i_1 = 0; i_1 < importMatch.length; i_1++) {
                                    tempArr = importMatch[i_1].match(expRequirePath);
                                    if (tempArr) {
                                        importList[exportName][(tempArr.pop() || tempArr.pop()).split('/').pop()] = 1;
                                    }
                                }
                            }
                        }
                    }
                    console.log("importList", importList);
                }
                text = text.replace(/^(\s+)?import\s/g, "//import ").replace(/\n(\s+)?import\s/g, "//import ").replace(/\n(\s+)?export\s?\=/g, "//export=");
                TSParser.host.addFile(TSParser.dummyScriptName, text);
                var program = ts.createProgram([TSParser.dummyScriptName], TSParser.host.getCompilationSettings(), TSParser.host);
                var typeChecker = program.getTypeChecker();
                var sf = program.getSourceFile(TSParser.dummyScriptName);
                var decls = sf.getNamedDeclarations();
                var nd;
                var symbol;
                var symbols;
                var data = {};
                var k, l, nd2, nd3, ty2, ty3;
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
                for (var key in decls) {
                    for (var key1 in decls[key]) {
                        nd = decls[key][key1];
                        type = typeChecker.getTypeAtLocation(nd);
                        name = ts.getDeclaredName(typeChecker, nd.symbol, nd);
                        k = TSParser.getSymbolTypeOfFlag(nd.symbol.flags);
                        if (k == null)
                            continue;
                        modifier = TSParser.getNodeModifiers(nd);
                        if (k == TSParser.STR_CLASS || k == TSParser.STR_INTERFACE) {
                            if (typeof data[k] === TSParser.STR_UNDEFINED)
                                data[k] = [];
                            classObj = {
                                name: name,
                                type: TSParser.getTypeString(typeChecker, type),
                                modifier: modifier,
                                text: ts.getTextOfNode(nd)
                            };
                            methodGenericMatch = classObj.text.substr(0, classObj.text.indexOf('{')).match(exp_generic);
                            if (methodGenericMatch) {
                                genericList[methodGenericMatch[1]] = 0;
                            }
                            expList = [];
                            if (typeof nd["heritageClauses"] !== TSParser.STR_UNDEFINED) {
                                var hnd = nd["heritageClauses"][0];
                                var expressNode = void 0;
                                var expNameArr = [];
                                for (var r = 0; r < hnd.types.length; r++) {
                                    expressNode = ts.getEntityNameFromTypeNode(hnd.types[r]);
                                    if (expressNode) {
                                        if (expressNode.name)
                                            expNameArr.push(expressNode.name.text);
                                        else if (expressNode.text)
                                            expNameArr.push(expressNode.text);
                                    }
                                    expressNode = null;
                                    expList.push(expNameArr.join('.'));
                                    expNameArr.length = 0;
                                }
                            }
                            var impList = [];
                            implementList = classObj.text.match(exp_implementList);
                            if (implementList) {
                                implementList.shift();
                                for (var o = 0; o < implementList.length; o++) {
                                    if (implementList[o]) {
                                        impList.push(implementList[o]);
                                    }
                                }
                            }
                            classObj.super = expList;
                            classObj.implements = impList;
                            data[k].push(classObj);
                            nd2 = nd.symbol.getDeclarations()[0];
                            ty2 = typeChecker.getTypeAtLocation(nd2);
                            symbols = ty2.getProperties();
                            for (var key2 in symbols) {
                                symbol = symbols[key2];
                                l = TSParser.getSymbolTypeOfFlag(symbol.flags);
                                if (l == null)
                                    continue;
                                if (typeof classObj[l] === TSParser.STR_UNDEFINED)
                                    classObj[l] = [];
                                nd3 = symbol.getDeclarations()[0];
                                ty3 = typeChecker.getTypeAtLocation(nd3);
                                if (l == TSParser.STR_PROPERTY) {
                                    typeName = null;
                                    txtOfNode = ts.getTextOfNode(nd3);
                                    if (symbol["valueDeclaration"] && symbol["valueDeclaration"]["type"]) {
                                        typeName = ts.getTextOfNode(symbol["valueDeclaration"]["type"]);
                                        if (txtOfNode.indexOf("[]") > -1) {
                                            typeName = typeName.replace(/\[\]/g, "［］");
                                        }
                                        else if (txtOfNode.indexOf("Array") > -1) {
                                            typeName = typeName.replace(/\</g, "〈").replace(/\>/g, "〉");
                                        }
                                        else {
                                            typeName = null;
                                        }
                                    }
                                    propertyInfo = {
                                        name: ts.getDeclaredName(typeChecker, symbol, nd3),
                                        type: typeName ? typeName : TSParser.getTypeString(typeChecker, ty3, (findUnknownObject ? symbol : null)),
                                        modifier: TSParser.getNodeModifiers(nd3)
                                    };
                                    classObj[l].push(propertyInfo);
                                }
                                else if (l == TSParser.STR_METHOD) {
                                    st = ty3.getCallSignatures()[0];
                                    methodInfo = {
                                        name: ts.getDeclaredName(typeChecker, symbol, nd3),
                                        type: TSParser.getTypeString(typeChecker, st.getReturnType(), (findUnknownObject ? symbol : null)),
                                        modifier: TSParser.getNodeModifiers(nd3),
                                        parameters: TSParser.getParameterInfo(typeChecker, st, findUnknownObject),
                                        text: ts.getTextOfNode(nd3)
                                    };
                                    methodGenericMatch = methodInfo.text.substr(0, methodInfo.text.indexOf('{')).match(exp_generic);
                                    if (methodGenericMatch) {
                                        genericList[methodGenericMatch[1]] = 0;
                                    }
                                    classObj[l].push(methodInfo);
                                }
                            }
                        }
                        else if (modifier == TSParser.STR_STATIC) {
                            var lo = TSParser.getSymbolTypeOfFlag(nd.symbol.flags);
                            if (typeof classObj[lo] === TSParser.STR_UNDEFINED)
                                classObj[lo] = [];
                            if (lo == TSParser.STR_PROPERTY) {
                                classObj[lo].push({
                                    name: ts.getDeclaredName(typeChecker, nd.symbol, nd),
                                    type: TSParser.getTypeString(typeChecker, type, (findUnknownObject ? nd.symbol : null)),
                                    modifier: modifier
                                });
                            }
                            else if (lo == TSParser.STR_METHOD) {
                                st = type.getCallSignatures()[0];
                                var static_method_info = {
                                    name: ts.getDeclaredName(typeChecker, nd.symbol, nd),
                                    type: TSParser.getTypeString(typeChecker, st.getReturnType(), (findUnknownObject ? nd.symbol : null)),
                                    modifier: modifier,
                                    parameters: TSParser.getParameterInfo(typeChecker, st, findUnknownObject),
                                    text: ts.getTextOfNode(nd)
                                };
                                methodGenericMatch = static_method_info.text.substr(0, static_method_info.text.indexOf('{')).match(exp_generic);
                                if (methodGenericMatch) {
                                    genericList[methodGenericMatch[1]] = 0;
                                }
                                classObj[lo].push(static_method_info);
                            }
                            lo = null;
                        }
                    }
                }
                data.genericList = genericList;
                data.importList = importList;
                return data;
            };
            TSParser.analysisObjectToYUMLCode = function (data, containMembers, relationConnect) {
                if (containMembers === void 0) { containMembers = true; }
                if (relationConnect === void 0) { relationConnect = true; }
                var list = [];
                var temp = [];
                var dclass;
                var dinter;
                var p, m, args;
                var relation = new RelationList(data.genericList);
                list.push("//define");
                if (data.class) {
                    for (var o in data.class) {
                        dclass = data.class[o];
                        relation.addExceptionName(dclass.name);
                        if (data.importList && data.importList[dclass.name]) {
                            for (var key in data.importList[dclass.name]) {
                                relation.add(key);
                            }
                        }
                        p = dclass.property;
                        m = dclass.method;
                        temp.length = 0;
                        temp.push("[" + dclass.name);
                        if (p) {
                            if (containMembers) {
                                temp.push("|");
                                for (var i = 0, li = p.length; i < li; i++) {
                                    if (i > 0)
                                        temp.push(";");
                                    temp.push(TSParser.getKindModifiersChar(p[i].modifier) + p[i].name + ":" + p[i].type);
                                    relation.add(p[i].type);
                                }
                            }
                            else {
                                for (var i = 0, li = p.length; i < li; i++) {
                                    relation.add(p[i].type);
                                }
                            }
                        }
                        if (m) {
                            if (containMembers) {
                                temp.push("|");
                                for (var i = 0, li = m.length; i < li; i++) {
                                    if (i > 0)
                                        temp.push(";");
                                    temp.push(TSParser.getKindModifiersChar(m[i].modifier) + m[i].name + "(");
                                    for (var j = 0, lj = m[i].parameters.length; j < lj; j++) {
                                        if (j > 0)
                                            temp.push("，");
                                        temp.push(m[i].parameters[j].name + ":" + m[i].parameters[j].type);
                                        relation.add(m[i].parameters[j].type);
                                    }
                                    temp.push("):" + m[i].type);
                                    relation.add(m[i].type);
                                }
                            }
                            else {
                                for (var i = 0, li = m.length; i < li; i++) {
                                    for (var j = 0, lj = m[i].parameters.length; j < lj; j++) {
                                        relation.add(m[i].parameters[j].type);
                                    }
                                    relation.add(m[i].type);
                                }
                            }
                        }
                        temp.push("]");
                        list.push(temp.join(''));
                        if (relation.length > 0) {
                            relation.repetitionRemoval();
                            dclass.relation = relation.getList();
                        }
                        relation.reset();
                    }
                }
                if (data.interface) {
                    for (var o in data.interface) {
                        dinter = data.interface[o];
                        relation.addExceptionName(dinter.name);
                        p = dinter.property;
                        m = dinter.method;
                        temp.length = 0;
                        temp.push("[" + dinter.name);
                        if (p) {
                            if (containMembers) {
                                temp.push("|");
                                for (var i = 0, li = p.length; i < li; i++) {
                                    if (i > 0)
                                        temp.push(";");
                                    temp.push(TSParser.getKindModifiersChar(p[i].modifier) + p[i].name + ":" + p[i].type);
                                    relation.add(p[i].type);
                                }
                            }
                            else {
                                for (var i = 0, li = p.length; i < li; i++) {
                                    relation.add(p[i].type);
                                }
                            }
                        }
                        if (m) {
                            if (containMembers) {
                                temp.push("|");
                                for (var i = 0, li = m.length; i < li; i++) {
                                    if (i > 0)
                                        temp.push(";");
                                    temp.push(TSParser.getKindModifiersChar(m[i].modifier) + m[i].name + "(");
                                    for (var j = 0, lj = m[i].parameters.length; j < lj; j++) {
                                        if (j > 0)
                                            temp.push("，");
                                        temp.push(m[i].parameters[j].name + ":" + m[i].parameters[j].type);
                                        relation.add(m[i].parameters[j].type);
                                    }
                                    temp.push("):" + m[i].type);
                                    relation.add(m[i].type);
                                }
                            }
                            else {
                                for (var i = 0, li = m.length; i < li; i++) {
                                    for (var j = 0, lj = m[i].parameters.length; j < lj; j++) {
                                        relation.add(m[i].parameters[j].type);
                                    }
                                    relation.add(m[i].type);
                                }
                            }
                        }
                        temp.push("]");
                        list.push(temp.join(''));
                        if (relation.length > 0) {
                            relation.repetitionRemoval();
                            dinter.relation = relation.getList();
                        }
                        relation.reset();
                    }
                }
                list.push("//color");
                if (data.class) {
                    for (var o in data.class) {
                        list.push("[" + data.class[o].name + TSParser.STR_COLOR_CLASS + "]");
                    }
                }
                if (data.interface) {
                    for (var o in data.interface) {
                        list.push("[" + data.interface[o].name + TSParser.STR_COLOR_INTERFACE + "]");
                    }
                }
                list.push("//relation");
                if (data.class) {
                    for (var o in data.class) {
                        dclass = data.class[o];
                        for (var oo in dclass.super) {
                            temp.length = 0;
                            temp.push("[" + dclass.super[oo] + "]");
                            if (TSParser.isInterface(data, dclass.super[oo])) {
                                dclass.implements.push(dclass.super.splice(oo, 1)[0]);
                            }
                            else {
                                temp.push("^");
                            }
                            temp.push("[" + dclass.name + "]");
                            list.push(temp.join(''));
                        }
                        for (var ooo in dclass.implements) {
                            list.push("[" + dclass.implements[ooo] + "]^-.-" + "[" + dclass.name + "]");
                        }
                        if (dclass.relation && relationConnect) {
                            for (var oo in dclass.relation) {
                                list.push("[" + dclass.relation[oo] + "]-[" + dclass.name + "]");
                            }
                        }
                    }
                }
                if (data.interface) {
                    for (var o in data.interface) {
                        dinter = data.interface[o];
                        for (var oo in dinter.super) {
                            list.push("[" + dinter.super[oo] + "]^[" + dinter.name + "]");
                        }
                        if (dinter.relation && relationConnect) {
                            for (var oo in dinter.relation) {
                                list.push("[" + dinter.relation[oo] + "]-[" + dinter.name + "]");
                            }
                        }
                    }
                }
                for (var i = 0; i < list.length; i++) {
                    list[i] = list[i].split("-").sort().join("-");
                }
                var tempStr;
                for (var i = 0; i < list.length; i++) {
                    tempStr = list[i];
                    for (var j = i + 1; j < list.length; j++) {
                        if (list[j] == tempStr) {
                            list.splice(j, 1);
                            j--;
                        }
                    }
                }
                return list.join('\n');
            };
            TSParser.tsToYUMLCode = function (text, containMembers, findUnknownObject, relationConnect) {
                if (containMembers === void 0) { containMembers = true; }
                if (findUnknownObject === void 0) { findUnknownObject = true; }
                if (relationConnect === void 0) { relationConnect = true; }
                return TSParser.analysisObjectToYUMLCode(TSParser.tsToAnalysisObject(text, findUnknownObject), containMembers, relationConnect);
            };
            TSParser.dummyScriptName = "script.ts";
            TSParser.Reg_startArray = /Array＜/;
            TSParser.STR_CLASS = "class";
            TSParser.STR_INTERFACE = "interface";
            TSParser.STR_METHOD = "method";
            TSParser.STR_PROPERTY = "property";
            TSParser.STR_UNDEFINED = "undefined";
            TSParser.STR_STATIC = "static";
            TSParser.STR_COLOR_CLASS = "{bg:lightblue}";
            TSParser.STR_COLOR_INTERFACE = "{bg:wheat}";
            TSParser.defaultTypeList = ["string", "void", "any", "boolean", "number"];
            return TSParser;
        }());
        utils.TSParser = TSParser;
    })(utils = tj.utils || (tj.utils = {}));
})(tj || (tj = {}));
