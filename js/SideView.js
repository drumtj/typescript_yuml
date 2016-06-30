/// <reference path="./jquery/jquery.d.ts"/>
var SideView = (function () {
    function SideView(width, height, color) {
        if (width === void 0) { width = "400px"; }
        if (height === void 0) { height = "100%"; }
        if (color === void 0) { color = "rgb(235, 235, 235)"; }
        this.state = "open";
        this.$el = $("<div/>");
        this.$el.css({
            "position": "fixed",
            "left": "0px",
            "top": "0px",
            "width": width,
            "height": height,
            "background-color": color
        });
        var self = this;
        var $closeBt = $("<div/>").css({
            "background-image": "url(./images/circle_back_arrow.png)",
            "width": "32px",
            "height": "32px",
            "cursor": "pointer",
            "float": "right",
            "z-index": 10,
            "margin-top": 20
        }).click(function () {
            if (self.state == "open") {
                self.state = "close";
                $(this).css("background-image", "url(./images/circle_next_arrow.png)");
                self.$el.animate({
                    "left": -(parseInt(width) - 32)
                });
            }
            else {
                self.state = "open";
                $(this).css("background-image", "url(./images/circle_back_arrow.png)");
                self.$el.animate({
                    "left": 0
                });
            }
        });
        this.$el.append($closeBt);
    }
    return SideView;
})();
