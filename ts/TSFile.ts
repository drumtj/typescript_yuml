/// <reference path="./jquery/jquery.d.ts"/>

class TSFile{
  //static IMG_TS_FILE:string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAAEZ0FNQQAAsY8L/GEFAAAACXBIWXMAAA7EAAAOxAGVKw4bAAACrElEQVR4Xu2avWsiQRiHfxoTrRItJLGNjWn8B1KKja2FoGBjEbAwCDGQLoVdwNI0amUbBbEQxEZUiGWKWFibLlUwxviRu1leuOMqXXfH2Zt5QH7zgYIP7jsyM7af30Bi7JTSogRQSosSQCktuleBbreLfr+P9XpNI7vhdDqRyWRwdHREI3zQJaDdbiObzVLPGE5OTnB+fo5yucxVgq5HoNPpUMtYPj8/kUql8P39TSPmo0vAcrmklvHwliBkEeQpQdhVgJcEoZdBHhKEFsAwW4LwAhhmSrCEAIZZEiwjgGGGBEsJYBgtwXICGEZKsKQAhlEShBFgs9motTlGSBBGwGw2o9Z27CpBGAHz+RyTyQTT6VSTsc3r/f0d19fX9EnboWs/4ObmBq1Wi3pi4Ha70ev1qLc5li2CRqEEUEqLEkApLUoApbQoAZTSogRQSosSQCktSgCltCgBlNKiBFBKC1cB7CKUy+WinhgYtimaTqcRCoVwcHAAh8Oh7fJ+fX2h0WigXq/j9vYWwWBQ2/8fjUZ4eHjAx8cHvXt39r4pWiwWEY1G8fj4iNfXV62dSCTw9PSkifF6vYjH44jFYhgOh1itVvTO/WL6I8AuVLFfBbv6ZrfbtXuFzWZTO9AQAS41gF2rYwce1WoVyWQSHo+HZvYPFwHs9CaXyyGfz2uXIUulEk5PT2l2v3ARwAofq7UvLy+4v7/HeDzG5eUlze4XLgKurq4QiUS0GnB8fAyfz4e3tzea3S+GC2BL37/LGyt64XAYtVoNlUpFqwnPz880+wc9R+S7wvVw9PDwUFv+jLph/jeWOBxdLBamfPld4CpARJQAyq0IBALUEoeLiwtqbYeuIsie5UKhgMFgIMR/er/fj7u7O5ydndHI5ugS8D+hagCltCgBlNIiuQDgF/4TWDjqbt5XAAAAAElFTkSuQmCC";
  name:string;
  text:string;
  $el:JQuery;
  cid:number;
  enable:boolean = true;
  static template:string = (function(){
    return '' +
      '<div class="fileicon">' +
      '<div class="iconContainer">' +
        '<img class="eyeBtn" src="./images/eye-view.png" />' +
        '<img class="trashBtn" src="./images/trash.png" />' +
      '</div>' +
      '</div>' +
    '<span class="filename">[FILENAME]<span/>' ;
  }());
  static $styleElement:JQuery;
  $trashBtn:JQuery;
  $eyeBtn:JQuery;

  constructor(name:string, text:string){
    this.cid = Date.now();
    this.name = name;
    this.text = text;
    this.$el = $("<div class='tsfile'></div>");

    if( !TSFile.$styleElement ){
      TSFile.$styleElement = $("<style/>").html(
        '.tsfile{text-align:center;}' +
        '.tsfile .fileicon{background-image:url("./images/ts-64.png"); background-repeat:no-repeat; width:82px; height:64px; margin-left:auto; margin-right:auto;}' +
        '.tsfile .iconContainer img{cursor:pointer;display:block;}' +
        '.tsfile .iconContainer{position:relative; left:55px; width:24px}'
      );
      $(document.documentElement).append(TSFile.$styleElement);
    }

    this.$el.append( TSFile.template.replace("[FILENAME]", name) );

    var self = this;
    this.$trashBtn = this.$el.find(".trashBtn");
    this.$eyeBtn = this.$el.find(".eyeBtn").click(function(){
      if( self.enable ){
        this.src = "./images/eye-hidden.png";
        self.$el.css("opacity", 0.5);
        self.enable = false;
      }else{
        this.src = "./images/eye-view.png";
        self.$el.css("opacity", 1);
        self.enable = true;
      }
    });


    this.$el.data("tsFile", this);
  }
}
