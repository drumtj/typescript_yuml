/// <reference path="./jquery/jquery.d.ts"/>
/// <reference path="./lodash/lodash.d.ts"/>
/// <reference path="./TSFile.ts"/>

class TSFileListView{
  $el:JQuery;
  list:Array<TSFile> = [];
  constructor(width:string="100%", height:string="100%", color:string="none"){
    this.$el = $("<div/>", {id:"TSFileListView"}).css({
      "width":width,
      "height":height,
      "background-color":color,
      "overflow-y":"scroll"
    });
  }

  add( f:TSFile ){
    (function(self, file){
      file.$trashBtn.click(function(){
        if(confirm("정말로 삭제합니까?")){
          self.removeFile(file);
        }
      });
    }(this,f));
    this.list.push( f );
    this.$el.append( f.$el );
  }

  get( index:number ):TSFile{
    return this.list[index];
  }

  removeFile( f:number );
  removeFile( f:HTMLElement );
  removeFile( f:TSFile );
  removeFile(f){
    if( typeof f === "number" ){
      var finfo = this.list[f];
      if(finfo){
        _.remove(this.list, function(fileInfo){
          if(fileInfo.cid == finfo.cid){
            fileInfo.$el.remove();
            return true;
          }
          return false;
        });
      }
    }else if( f instanceof HTMLElement ){
      _.remove(this.list, function(fileInfo){
        if(fileInfo.$el[0] == f){
          fileInfo.$el.remove();
          return true;
        }
        return false;
      });
    }else if( f instanceof TSFile ){
      _.remove(this.list, function(fileInfo){
        if(fileInfo.cid == f.cid){
          fileInfo.$el.remove();
          return true;
        }
        return false;
      });
    }
  }

  getList():Array<TSFile>{
    return this.list.concat();
  }

  getMergeText():string{
    var t = [];
		for(var i=0; i<this.list.length; i++){
      if(this.list[i].enable){
		    t.push(this.list[i].text);
      }
		}
    return t.join('\n');
  }
}
