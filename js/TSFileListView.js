var TSFileListView = (function () {
    function TSFileListView(width, height, color) {
        if (width === void 0) { width = "100%"; }
        if (height === void 0) { height = "100%"; }
        if (color === void 0) { color = "none"; }
        this.list = [];
        this.$el = $("<div/>", { id: "TSFileListView" }).css({
            "width": width,
            "height": height,
            "background-color": color,
            "overflow-y": "scroll"
        });
    }
    TSFileListView.prototype.add = function (f) {
        (function (self, file) {
            file.$trashBtn.click(function () {
                if (confirm("정말로 삭제합니까?")) {
                    self.removeFile(file);
                }
            });
        }(this, f));
        this.list.push(f);
        this.$el.append(f.$el);
    };
    TSFileListView.prototype.get = function (index) {
        return this.list[index];
    };
    TSFileListView.prototype.removeFile = function (f) {
        if (typeof f === "number") {
            var finfo = this.list[f];
            if (finfo) {
                _.remove(this.list, function (fileInfo) {
                    if (fileInfo.cid == finfo.cid) {
                        fileInfo.$el.remove();
                        return true;
                    }
                    return false;
                });
            }
        }
        else if (f instanceof HTMLElement) {
            _.remove(this.list, function (fileInfo) {
                if (fileInfo.$el[0] == f) {
                    fileInfo.$el.remove();
                    return true;
                }
                return false;
            });
        }
        else if (f instanceof TSFile) {
            _.remove(this.list, function (fileInfo) {
                if (fileInfo.cid == f.cid) {
                    fileInfo.$el.remove();
                    return true;
                }
                return false;
            });
        }
    };
    TSFileListView.prototype.getList = function () {
        return this.list.concat();
    };
    TSFileListView.prototype.getMergeText = function () {
        var t = [];
        for (var i = 0; i < this.list.length; i++) {
            if (this.list[i].enable) {
                t.push(this.list[i].text);
                t.push("/*eof*/");
            }
        }
        return t.join('\n');
    };
    return TSFileListView;
}());
