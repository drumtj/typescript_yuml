/// <reference path="./jquery/jquery.d.ts"/>
var TSFile = (function () {
    function TSFile(name, text) {
        this.enable = true;
        this.cid = Date.now();
        this.name = name;
        this.text = text;
        this.$el = $("<div class='tsfile'></div>");
        if (!TSFile.$styleElement) {
            TSFile.$styleElement = $("<style/>").html('.tsfile{text-align:center;}' +
                '.tsfile .fileicon{background-image:url("./images/ts-64.png"); background-repeat:no-repeat; width:82px; height:64px; margin-left:auto; margin-right:auto;}' +
                '.tsfile .iconContainer img{cursor:pointer;display:block;}' +
                '.tsfile .iconContainer{position:relative; left:55px; width:24px}');
            $(document.documentElement).append(TSFile.$styleElement);
        }
        this.$el.append(TSFile.template.replace("[FILENAME]", name));
        var self = this;
        this.$trashBtn = this.$el.find(".trashBtn");
        this.$eyeBtn = this.$el.find(".eyeBtn").click(function () {
            if (self.enable) {
                this.src = "./images/eye-hidden.png";
                self.$el.css("opacity", 0.5);
                self.enable = false;
            }
            else {
                this.src = "./images/eye-view.png";
                self.$el.css("opacity", 1);
                self.enable = true;
            }
        });
        this.$el.data("tsFile", this);
    }
    TSFile.template = (function () {
        return '' +
            '<div class="fileicon">' +
            '<div class="iconContainer">' +
            '<img class="eyeBtn" src="./images/eye-view.png" />' +
            '<img class="trashBtn" src="./images/trash.png" />' +
            '</div>' +
            '</div>' +
            '<span class="filename">[FILENAME]<span/>';
    }());
    return TSFile;
})();
