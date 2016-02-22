var CTP;
(function (CTP) {
    var patch;
    (function (patch_1) {
        var layers = [];
        var RATIO = 0.283464566929133;
        var _c = document.querySelector("#mycanvas2");
        var _ctx = _c.getContext("2d");
        var StitchType;
        (function (StitchType) {
            StitchType[StitchType["Normal"] = 0] = "Normal";
            StitchType[StitchType["Jump"] = 1] = "Jump";
            StitchType[StitchType["Trim"] = 2] = "Trim";
            StitchType[StitchType["Stop"] = 4] = "Stop";
            StitchType[StitchType["End"] = 8] = "End";
        })(StitchType || (StitchType = {}));
        function decodeExp(b2) {
            //console.log("DECODE B2", b2);
            var returnCode = 0;
            if (b2 === 0xF3) {
                return StitchType.End;
            }
            if ((b2 & 0xC3) === 0xC3) {
                return StitchType.Trim | StitchType.Stop;
            }
            if (b2 & 0x80) {
                returnCode |= StitchType.Trim;
            }
            if (b2 & 0x40) {
                returnCode |= StitchType.Stop;
            }
            return returnCode;
        }
        function dstRead(file, pattern) {
            console.log("DST READ FILE", file);
            console.log("DST READ PATTERN", pattern);
            //console.log("\nFILE TELL", file.tell());
            //console.log("BYTE COUNT", file.byteLength);
            var flags;
            var x;
            var y;
            //var prevJump: any = false;
            //var thisJump: any = false;
            var prevJump = 0;
            var thisJump = 0;
            var b = [];
            var byteCount = file.byteLength;
            file.seek(512);
            //file.seek(0x100);
            while (file.tell() < (byteCount - 3)) {
                b[0] = file.getUint8();
                b[1] = file.getUint8();
                b[2] = file.getUint8();
                //b[0] = file._getUint8();
                //b[1] = file._getUint8();
                //b[2] = file._getUint8();
                //console.log("B[]", b)
                x = 0;
                y = 0;
                if (b[0] & 0x01)
                    x += 1;
                if (b[0] & 0x02)
                    x -= 1;
                if (b[0] & 0x04)
                    x += 9;
                if (b[0] & 0x08)
                    x -= 9;
                if (b[0] & 0x80)
                    y += 1;
                if (b[0] & 0x40)
                    y -= 1;
                if (b[0] & 0x20)
                    y += 9;
                if (b[0] & 0x10)
                    y -= 9;
                if (b[1] & 0x01)
                    x += 3;
                if (b[1] & 0x02)
                    x -= 3;
                if (b[1] & 0x04)
                    x += 27;
                if (b[1] & 0x08)
                    x -= 27;
                if (b[1] & 0x80)
                    y += 3;
                if (b[1] & 0x40)
                    y -= 3;
                if (b[1] & 0x20)
                    y += 27;
                if (b[1] & 0x10)
                    y -= 27;
                if (b[2] & 0x04)
                    x += 81;
                if (b[2] & 0x08)
                    x -= 81;
                if (b[2] & 0x20)
                    y += 81;
                if (b[2] & 0x10)
                    y -= 81;
                x *= RATIO;
                y *= RATIO;
                flags = decodeExp(b[2]);
                thisJump = flags & StitchType.Jump;
                //console.log("THIS JUMP", thisJump);
                if (prevJump) {
                    flags |= StitchType.Jump;
                }
                pattern.addStitchRel(x, y, flags, true);
                prevJump = thisJump;
            }
            pattern.addStitchRel(0, 0, StitchType.End, true);
            pattern.invertPatternVertical();
        }
        var Color = (function () {
            function Color(r, g, b, description) {
                this.r = r;
                this.g = g;
                this.b = b;
                this.description = description;
            }
            return Color;
        }());
        var Stitch = (function () {
            function Stitch(x, y, flags, color) {
                this.x = x;
                this.y = y;
                this.flags = flags;
                this.color = color;
            }
            return Stitch;
        }());
        var Pattern = (function () {
            function Pattern() {
                this.colors = [];
                this.stitches = [];
                //hoop = {};
                this.lastX = 0;
                this.lastY = 0;
                this.top = 0;
                this.bottom = 0;
                this.left = 0;
                this.right = 0;
                this.currentColorIndex = 0;
            }
            //constructor() {
            //}
            Pattern.prototype.addColorRgb = function (r, g, b, description) {
                this.colors[this.colors.length] = new Color(r, g, b, description);
            };
            Pattern.prototype.addColor = function (color) {
                this.colors[this.colors.length] = color;
            };
            Pattern.prototype.addStitchAbs = function (x, y, flags, isAutoColorIndex) {
                //console.log("FLAGS: ", flags);
                if ((flags & StitchType.End) === StitchType.End) {
                    this.calculateBoundingBox();
                    this.fixColorCount();
                }
                if (((flags & StitchType.Stop) === StitchType.Stop) && this.stitches.length === 0) {
                    return;
                }
                if (((flags & StitchType.Stop) === StitchType.Stop) && isAutoColorIndex) {
                    this.currentColorIndex += 1;
                    //////////////////////////////
                    layers.push([]);
                }
                ///////////////////////////////
                if (!layers.length) {
                    layers.push([]);
                }
                var currentLayer = layers[layers.length - 1];
                currentLayer.push(x, y);
                ///////////////////////////////
                this.stitches[this.stitches.length] = new Stitch(x, y, flags, this.currentColorIndex);
            };
            Pattern.prototype.addStitchRel = function (dx, dy, flags, isAutoColorIndex) {
                ///////////////////////
                //if (flags === StitchType.Jump) {
                //    console.log("JUMP");
                //}
                ///////////////////////
                if (this.stitches.length !== 0) {
                    var nx = this.lastX + dx;
                    var ny = this.lastY + dy;
                    this.lastX = nx;
                    this.lastY = ny;
                    this.addStitchAbs(nx, ny, flags, isAutoColorIndex);
                }
                else {
                    this.addStitchAbs(dx, dy, flags, isAutoColorIndex);
                }
            };
            Pattern.prototype.calculateBoundingBox = function () {
                var stitchCount = this.stitches.length;
                var pt;
                if (stitchCount === 0) {
                    this.bottom = 1;
                    this.right = 1;
                    return;
                }
                this.left = Number.MAX_VALUE;
                this.top = Number.MAX_VALUE;
                this.right = Number.MIN_VALUE;
                this.bottom = Number.MIN_VALUE;
                for (var i = 0; i < stitchCount; i++) {
                    pt = this.stitches[i];
                    if (!(pt.flags & StitchType.Trim)) {
                        this.left = this.left < pt.x ? this.left : pt.x;
                        this.top = this.top < pt.y ? this.top : pt.y;
                        this.right = this.right > pt.x ? this.right : pt.x;
                        this.bottom = this.bottom > pt.y ? this.bottom : pt.y;
                    }
                }
            };
            Pattern.prototype.moveToPositive = function () {
                var stitchCount = this.stitches.length;
                for (var i = 0; i < stitchCount; i++) {
                    this.stitches[i].x -= this.left;
                    this.stitches[i].y -= this.top;
                }
                this.right -= this.left;
                this.left = 0;
                this.bottom -= this.top;
                this.top = 0;
            };
            Pattern.prototype.invertPatternVertical = function () {
                var temp = -this.top;
                var stitchCount = this.stitches.length;
                for (var i = 0; i < stitchCount; i++) {
                    this.stitches[i].y = -this.stitches[i].y;
                }
                this.top = -this.bottom;
                this.bottom = temp;
            };
            Pattern.prototype.addColorRandom = function () {
                console.log("COLORS", this.colors);
                this.colors[this.colors.length] = new Color(Math.round(Math.random() * 256), Math.round(Math.random() * 256), Math.round(Math.random() * 256), "random");
            };
            Pattern.prototype.fixColorCount = function () {
                var maxColorIndex = 0;
                var stitchCount = this.stitches.length;
                for (var i = 0; i < stitchCount; i++) {
                    maxColorIndex = Math.max(maxColorIndex, this.stitches[i].color);
                }
                while (this.colors.length <= maxColorIndex) {
                    this.addColorRandom();
                }
                this.colors.splice(maxColorIndex + 1, this.colors.length - maxColorIndex - 1);
            };
            Pattern.prototype.drawShape = function (canvas) {
                canvas.width = this.right;
                canvas.height = this.bottom;
                if (canvas.getContext) {
                    var ctx = canvas.getContext("2d");
                    ctx.beginPath();
                    var color = this.colors[this.stitches[0].color];
                    ctx.strokeStyle = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
                    for (var i = 0; i < this.stitches.length; i++) {
                        var currentStitch = this.stitches[i];
                        /////////////////
                        var rs = 25;
                        //if (currentStitch.flags === StitchType.Jump) {
                        //    console.log("JUMP STITCH", currentStitch);
                        //    //_ctx.beginPath();
                        //    _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                        //    _ctx.fillStyle = "red";
                        //    _ctx.fill();
                        //}
                        //if (currentStitch.flags === StitchType.Trim) {
                        //    console.log("TRIM STITCH", currentStitch);
                        //    //_ctx.beginPath();
                        //    _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                        //    _ctx.fillStyle = "blue";
                        //    _ctx.fill();
                        //}
                        //if (currentStitch.flags === StitchType.Stop) {
                        //    console.log("STOP STITCH", currentStitch);
                        //    //_ctx.beginPath();
                        //    _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                        //    _ctx.fillStyle = "green";
                        //    _ctx.fill();
                        //}
                        /////////////////
                        if (currentStitch.flags === StitchType.Jump ||
                            currentStitch.flags === StitchType.Trim ||
                            currentStitch.flags === StitchType.Stop) {
                            ctx.stroke();
                            var color_1 = this.colors[currentStitch.color];
                            ctx.beginPath();
                            /////////////////////////
                            //ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                            //ctx.fill();
                            /////////////////////////
                            ctx.strokeStyle = "rgb(" + color_1.r + "," + color_1.g + "," + color_1.b + ")";
                            ctx.moveTo(currentStitch.x, currentStitch.y);
                        }
                        ctx.lineTo(currentStitch.x, currentStitch.y);
                    }
                    ///////////////////////
                    //ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                    //ctx.fill();
                    ///////////////////////
                    ctx.stroke();
                    ///////////////////////////////
                    _ctx.globalAlpha = 0.5;
                    for (var i = 0; i < this.stitches.length; i++) {
                        var currentStitch = this.stitches[i];
                        /////////////////
                        var rs = 25;
                        //if (currentStitch.flags === StitchType.Normal) {
                        //if ((currentStitch.flags & StitchType.Normal) === StitchType.Normal) {
                        //    //console.log("NORMAL STITCH", currentStitch);
                        //    _ctx.beginPath();
                        //    _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                        //    _ctx.fillStyle = "purple";
                        //    _ctx.fill();
                        //    _ctx.stroke();
                        //}
                        //if (currentStitch.flags === StitchType.Jump) {
                        //if ((currentStitch.flags & StitchType.Jump) === StitchType.Jump) {
                        if (((currentStitch.flags & StitchType.Jump) === StitchType.Jump) || currentStitch.flags === 1) {
                            console.log("JUMP STITCH", currentStitch);
                            _ctx.beginPath();
                            _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                            _ctx.fillStyle = "red";
                            _ctx.fill();
                            _ctx.lineWidth = 2;
                            _ctx.strokeStyle = "black";
                            _ctx.stroke();
                        }
                        //if (currentStitch.flags === StitchType.Trim) {
                        //if ((currentStitch.flags & StitchType.Trim) === StitchType.Trim) {
                        //    console.log("TRIM STITCH", currentStitch);
                        //    _ctx.beginPath();
                        //    _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                        //    _ctx.fillStyle = "blue";
                        //    _ctx.fill();
                        //    _ctx.stroke();
                        //}
                        //if (currentStitch.flags === StitchType.Stop) {
                        if ((currentStitch.flags & StitchType.Stop) === StitchType.Stop) {
                            console.log("STOP STITCH", currentStitch);
                            _ctx.beginPath();
                            _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                            _ctx.fillStyle = "green";
                            _ctx.fill();
                            _ctx.stroke();
                            var next = this.stitches[i + 1];
                            if (next) {
                                _ctx.beginPath();
                                _ctx.rect(next.x, next.y, 15, 15);
                                _ctx.fillStyle = "red";
                                _ctx.fill();
                                _ctx.stroke();
                            }
                        }
                        if ((currentStitch.flags & StitchType.End) === StitchType.End) {
                            console.log("END STITCH", currentStitch);
                            _ctx.beginPath();
                            _ctx.rect(currentStitch.x, currentStitch.y, rs, rs);
                            _ctx.fillStyle = "orange";
                            _ctx.fill();
                            _ctx.stroke();
                        }
                    }
                    _ctx.globalAlpha = 1;
                    ///////////////////////////////
                    ///////////////////////////////
                    console.log("LAYERS", layers);
                    _c.width = this.right;
                    _c.height = this.bottom;
                    //_ctx.globalAlpha = 0.5;
                    layers.reverse().forEach(function (layer) {
                        var len = layer.length;
                        _ctx.beginPath();
                        //_ctx.moveTo(layer[0], layer[1]);
                        //_ctx.moveTo(layer[0] -= this.right, layer[1] -= this.bottom);
                        _ctx.moveTo(layer[0] + 200, layer[1] + 200);
                        for (var i = 2; i < len; i += 2) {
                            //_ctx.lineTo(layer[i], layer[i+1]);
                            _ctx.lineTo(layer[i] + 200, layer[i + 1] + 200);
                        }
                        var color = "#" + ((Math.random() * 0xffffff) >> 0).toString(16);
                        _ctx.closePath();
                        _ctx.fillStyle = color;
                        //_ctx.fill("evenodd");
                        _ctx.strokeStyle = "black";
                        _ctx.lineWidth = 2;
                        _ctx.stroke();
                    });
                    _ctx.globalAlpha = 1;
                }
            };
            return Pattern;
        }());
        var patches = [
            "ohio 4in.DST",
            "A06inch.DST",
            "B.DST",
            "football border.DST",
            "football.DST",
            "GONZAGA.DST",
            "leprechaun 5in.DST",
            "O 5 INCH.DST",
            "ohio 4in.DST",
            "ohio state border.DST" // 9
        ].map(function (patch) { return ("patches/" + patch); });
        //import ILogger = core.ILogger;
        var PatchReader = (function () {
            function PatchReader($http, logger) {
                //logger.foo("SUCK")
                //logger.foo("SUCK", { fudge: "packer" });
                //logger.foo("SUCK", { fudge: "packer" }, "TRY AGAIN");
                var _this = this;
                this.logger = logger;
                //logger.log("DEEZ", "NUTS");
                //logger.error("DA FUCK", 3423, "ASSHOLE");
                //logger.error("DA FUCK", 3423);
                //logger.success("GOOD", "", "JOB");
                //logger.warning("WARNING", { ass: "hole" }, "you fucked up");
                //logger.warning("WARNING", "you fucked up");
                //logger.info("HEY", [3, 3, 5, 2, 3], "THAT'S NEAT");
                //logger.success("DAMN");
                $http({
                    method: "GET",
                    url: patches[0],
                    //url: "/patches/ohio4in.DST"
                    //url: "patches/B.DST",
                    //url: "patches/ohio 4in.DST",
                    //url: "patches/" +  _.sample(patches),
                    responseType: "arraybuffer"
                }).then(function (response) {
                    console.log("RESPONSE", response);
                    console.log("RES SUCCESS STATUS: ", response.status);
                    //console.log("RES SUCCESS DATA", response.data);
                    //var file = new Blob([(response)], { type: "application/octet-binary" });
                    //var file = new Blob([(response)]);
                    var file = new Blob([response.data]);
                    _this.read(file);
                    //this.read(response.data);
                }, function (response) {
                    // Error
                    console.log("RES ERROR STATUS: ", response.status);
                    console.log("RES ERROR DATA", response.data || "Request failed");
                });
            }
            PatchReader.prototype.read = function (file) {
                var reader = new FileReader();
                reader.onloadend = function (event) {
                    console.log("EVENT SIZE", event.size);
                    console.log("LOAD END: ", event);
                    var view = new jDataView(event.target.result, 0);
                    //var view = new jDataView(file, 0);
                    var pattern = new Pattern();
                    dstRead(view, pattern);
                    pattern.moveToPositive();
                    pattern.drawShape(document.getElementById('mycanvas'));
                    console.log("VIEW", view);
                };
                reader.readAsArrayBuffer(file);
                console.log("FILE", file);
                console.log("FILE NAME", file.name);
            };
            return PatchReader;
        }());
        patch_1.patchModule
            .run(function (PatchReader) { })
            .service("PatchReader", PatchReader);
    })(patch = CTP.patch || (CTP.patch = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=convert-patch.js.map