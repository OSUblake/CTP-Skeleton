var CTP;
(function (CTP) {
    var patch;
    (function (patch) {
        var PatchService = (function () {
            function PatchService($http, logger, dstRead) {
                this.$http = $http;
                this.logger = logger;
                this.dstRead = dstRead;
                this.patches = [];
            }
            PatchService.prototype.createPatch = function (file) {
                var _this = this;
                var canvas = document.querySelector("#mycanvas3");
                var reader = new FileReader();
                reader.onloadend = function (event) {
                    var view = new jDataView(event.target.result, 0);
                    var pattern = new patch.Pattern();
                    _this.dstRead(view, pattern);
                    pattern.moveToPositive();
                    pattern.drawShape(canvas);
                    _this.render(pattern);
                };
                reader.readAsArrayBuffer(file);
            };
            PatchService.prototype.render = function (pattern) {
                _.forEach(pattern._stitches, function (layer) {
                    var canvas = document.createElement("canvas");
                    var context = canvas.getContext("2d");
                    canvas.className = "test-canvas";
                    $("body").append(canvas);
                    canvas.width = pattern.right;
                    canvas.height = pattern.bottom;
                    _.forEach(layer, function (stitch) {
                        if (stitch.flags === patch.StitchType.Jump ||
                            stitch.flags === patch.StitchType.Trim ||
                            stitch.flags === patch.StitchType.Stop) {
                            context.stroke();
                            var color = pattern.colors[stitch.color];
                            context.beginPath();
                            context.strokeStyle = "black";
                            context.moveTo(stitch.x, stitch.y);
                        }
                        context.lineTo(stitch.x, stitch.y);
                    });
                    context.stroke();
                });
            };
            return PatchService;
        }());
        patch.PatchService = PatchService;
        patch.patchModule
            .service("PatchService", PatchService);
    })(patch = CTP.patch || (CTP.patch = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=patch-service.js.map