var TSFileDropper = (function () {
    function TSFileDropper(fileListView, fileDropHandle) {
        this.fileListView = fileListView;
        var $holder = $("<div/>", { id: "holder" });
        var $state = $("<p/>", { id: "status" });
        var $style = $("<style/>").html('#holder { border: 10px dashed rgb(21, 109, 173); width: 300px; height: 300px; margin: 20px auto; background-color: rgba(82, 255, 177, 0.19);}' +
            '#holder.hover { border: 10px dashed #333; }' +
            '#status { padding:5px; color: #fff; background: #ccc; }' +
            '#status.success { background: #0c0; }' +
            '#status.fail { background: rgba(231, 25, 25, 1); }');
        this.fileDropHandle = fileDropHandle;
        var $container = $("<div/>", { id: "TSFileDropper" });
        $container.append($style);
        $container.append($holder);
        $container.append($state);
        this.$el = $container;
        if (typeof window["FileReader"] === 'undefined') {
            $state.addClass('fail');
        }
        else {
            $state.addClass('success');
            $state.html('FileReader available');
        }
        $holder.bind("dragover", function () { this.className = 'hover'; return false; });
        $holder.bind("dragend", function () { this.className = ''; return false; });
        $holder.bind("drop", this, function (e) {
            this.className = '';
            e.preventDefault();
            var self = e.data;
            var files = e.originalEvent.dataTransfer.files;
            var reader = new FileReader();
            var tsfiles = [];
            var idx = 0;
            function addTsfile() {
                console.log("addTsfile", files[idx]);
                if (idx >= files.length) {
                    if (self.fileDropHandle) {
                        self.fileDropHandle.call(self, tsfiles);
                    }
                    return;
                }
                if (/.ts$/.test(files[idx].name)) {
                    reader.readAsText(files[idx]);
                }
                else {
                    $state[0].className = 'fail';
                    $state.html(files[idx].name + ' : ts파일이 아닙니다');
                    idx++;
                    addTsfile();
                }
            }
            reader.onload = function (event) {
                $state[0].className = 'success';
                $state[0].innerHTML = 'loaded : ' + files[idx].name;
                var scriptText = event.target.result;
                tsfiles.push(new TSFile(files[idx].name, scriptText));
                idx++;
                addTsfile();
            };
            addTsfile();
            return false;
        });
    }
    return TSFileDropper;
}());
