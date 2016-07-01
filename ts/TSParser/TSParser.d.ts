declare module tj.utils{
  class TSParser {
    static init();
    static STR_CLASS:string;
    static STR_INTERFACE:string;
    static STR_METHOD:string;
    static STR_PROPERTY:string;
    static STR_UNDEFINED:string;
    static STR_STATIC:string;
    static STR_COLOR_CLASS:string;
    static STR_COLOR_INTERFACE:string;
    static defaultTypeList:Array<string>;
    static getKindModifiersChar( kindModifiers:string ):string;
    static getSymbolTypeOfFlag( flag:number ):string;
    static isInterface(data:any, name:string):boolean;
    static isClass(data:any, name:string):boolean;
    static isDefaultType(typename:string):boolean;
    static analysisObjectToYUMLCode(data:any, containMembers:boolean, relationConnect:boolean):string;
    static tsToAnalysisObject(text:string, findUnknownObject:boolean):any;
    static tsToYUMLCode(text:string, containMembers:boolean, findUnknownObject:boolean, relationConnect:boolean):string;
  }
}
