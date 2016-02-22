namespace CTP.patch {

    var layers = [];

    var RATIO = 0.283464566929133;
    var _c = <HTMLCanvasElement>document.querySelector("#mycanvas2");
    var _ctx = _c.getContext("2d");

    enum StitchType {
        Normal = 0,
        Jump = 1,
        Trim = 2,
        Stop = 4,
        End = 8
    }

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

            if (b[0] & 0x01) x += 1;
            if (b[0] & 0x02) x -= 1;
            if (b[0] & 0x04) x += 9;
            if (b[0] & 0x08) x -= 9;
            if (b[0] & 0x80) y += 1;
            if (b[0] & 0x40) y -= 1;
            if (b[0] & 0x20) y += 9;
            if (b[0] & 0x10) y -= 9;

            if (b[1] & 0x01) x += 3;
            if (b[1] & 0x02) x -= 3;
            if (b[1] & 0x04) x += 27;
            if (b[1] & 0x08) x -= 27;
            if (b[1] & 0x80) y += 3;
            if (b[1] & 0x40) y -= 3;
            if (b[1] & 0x20) y += 27;
            if (b[1] & 0x10) y -= 27;

            if (b[2] & 0x04) x += 81;
            if (b[2] & 0x08) x -= 81;
            if (b[2] & 0x20) y += 81;
            if (b[2] & 0x10) y -= 81;

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

    class Color {
        constructor(public r, public g, public b, public description) { }
    }

    class Stitch {
        constructor(public x, public y, public flags, public color) { }
    }

    class Pattern {

        colors = [];
        stitches = [];
        //hoop = {};
        lastX = 0;
        lastY = 0;
        top = 0;
        bottom = 0;
        left = 0;
        right = 0;
        currentColorIndex = 0;

        //constructor() {
            
        //}

        addColorRgb(r, g, b, description) {


            

            this.colors[this.colors.length] = new Color(r, g, b, description);
        }

        addColor(color) {
            this.colors[this.colors.length] = color;
        }

        addStitchAbs(x, y, flags, isAutoColorIndex) {

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

                
                //////////////////////////////
            }

            ///////////////////////////////
            if (!layers.length) {
                layers.push([]);
            }
            var currentLayer = layers[layers.length - 1];
            currentLayer.push(x, y);
            ///////////////////////////////

            this.stitches[this.stitches.length] = new Stitch(x, y, flags, this.currentColorIndex);
        }

        addStitchRel(dx, dy, flags, isAutoColorIndex) {

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

            } else {
                this.addStitchAbs(dx, dy, flags, isAutoColorIndex);
            }
        }

        calculateBoundingBox() {
            
            const stitchCount = this.stitches.length;
            let pt;

            if (stitchCount === 0) {
                this.bottom = 1;
                this.right = 1;
                return;
            }
            this.left   = Number.MAX_VALUE;
            this.top    = Number.MAX_VALUE;
            this.right  = Number.MIN_VALUE;
            this.bottom = Number.MIN_VALUE;

            for (let i = 0; i < stitchCount; i++) {
                pt = this.stitches[i];

                if (!(pt.flags & StitchType.Trim)) {

                    this.left   = this.left < pt.x ? this.left : pt.x;
                    this.top    = this.top  < pt.y ? this.top  : pt.y;
                    this.right  = this.right  > pt.x ? this.right  : pt.x;
                    this.bottom = this.bottom > pt.y ? this.bottom : pt.y;
                }
            }
            
        }

        moveToPositive() {

            const stitchCount = this.stitches.length;
            for (let i = 0; i < stitchCount; i++) {
                this.stitches[i].x -= this.left;
                this.stitches[i].y -= this.top;
            }
            this.right -= this.left;
            this.left = 0;
            this.bottom -= this.top;
            this.top = 0;
        }

        invertPatternVertical() {

            const temp = -this.top;
            const stitchCount = this.stitches.length;

            for (let i = 0; i < stitchCount; i++) {
                this.stitches[i].y = -this.stitches[i].y;
            }

            this.top = -this.bottom;
            this.bottom = temp;
        }

        addColorRandom() {

            console.log("COLORS", this.colors);


            this.colors[this.colors.length] = new Color(
                Math.round(Math.random() * 256),
                Math.round(Math.random() * 256),
                Math.round(Math.random() * 256), "random");
        }

        fixColorCount() {

            var maxColorIndex = 0;
            const stitchCount = this.stitches.length;

            for (let i = 0; i < stitchCount; i++) {
                maxColorIndex = Math.max(maxColorIndex, this.stitches[i].color);
            }

            while (this.colors.length <= maxColorIndex) {
                this.addColorRandom();
            }

            this.colors.splice(maxColorIndex + 1, this.colors.length - maxColorIndex - 1);
        }

        drawShape(canvas: HTMLCanvasElement) {

            canvas.width = this.right;
            canvas.height = this.bottom;

            if (canvas.getContext) {
                const ctx = canvas.getContext("2d");
                ctx.beginPath();
                const color = this.colors[this.stitches[0].color];
                ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;


                


                for (let i = 0; i < this.stitches.length; i++) {

                    let currentStitch = this.stitches[i];

                    /////////////////
                    let rs = 25;
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
                        const color = this.colors[currentStitch.color];
                        ctx.beginPath();

                        /////////////////////////
                        //ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                        //ctx.fill();
                        /////////////////////////

                        ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;
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
                for (let i = 0; i < this.stitches.length; i++) {

                    let currentStitch = this.stitches[i];

                    /////////////////
                    let rs = 25;

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




                    /////////////////
                }
                _ctx.globalAlpha = 1;

                ///////////////////////////////

                ///////////////////////////////

                console.log("LAYERS", layers);

                _c.width = this.right;
                _c.height = this.bottom;

                //_ctx.globalAlpha = 0.5;
                layers.reverse().forEach((layer) => {

                    var len = layer.length;

                    _ctx.beginPath();
                    //_ctx.moveTo(layer[0], layer[1]);
                    //_ctx.moveTo(layer[0] -= this.right, layer[1] -= this.bottom);
                    _ctx.moveTo(layer[0] + 200, layer[1] + 200);


                    for (let i = 2; i < len; i +=2) {

                        //_ctx.lineTo(layer[i], layer[i+1]);
                        _ctx.lineTo(layer[i] + 200, layer[i+1] +200);
                        //_ctx.lineTo(layer[i] - this.left, layer[i+1] - this.top);
                        //_ctx.moveTo(layer[i] += this.right, layer[i+1] += this.bottom);
                        //_ctx.lineTo(layer[i] + 100, layer[i+1] + 100);
                    }

                    let color = "#" + ((Math.random() * 0xffffff) >> 0).toString(16);

                    _ctx.closePath();
                    _ctx.fillStyle = color;
                    //_ctx.fill("evenodd");
                    _ctx.strokeStyle = "black";
                    _ctx.lineWidth = 2;
                    _ctx.stroke();
                });
                _ctx.globalAlpha = 1;

                ///////////////////////////////
            }
        }
    }

    //declare var jDataView;

    interface FileReaderEventTarget extends EventTarget {
        //result: string
        result: ArrayBuffer;
    }

    interface FileReaderEvent extends ProgressEvent {
        target: FileReaderEventTarget;
        //getMessage(): string;

        size: number;
    }

    var patches = [
        "ohio 4in.DST", // 0
        "A06inch.DST", // 1
        "B.DST", // 2
        "football border.DST", // 3
        "football.DST", // 4
        "GONZAGA.DST", // 5
        "leprechaun 5in.DST", // 6
        "O 5 INCH.DST", // 7
        "ohio 4in.DST", // 8
        "ohio state border.DST" // 9
    ].map(patch => `patches/${patch}`);

    //import ILogger = core.ILogger;

    class PatchReader {

        constructor($http: IHttpService, private logger: ILogger) {

            //logger.foo("SUCK")
            //logger.foo("SUCK", { fudge: "packer" });
            //logger.foo("SUCK", { fudge: "packer" }, "TRY AGAIN");

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
            }).then(response => {

                console.log("RESPONSE", response);
                console.log("RES SUCCESS STATUS: ", response.status);
                //console.log("RES SUCCESS DATA", response.data);

                //var file = new Blob([(response)], { type: "application/octet-binary" });
                //var file = new Blob([(response)]);
                var file = new Blob([response.data]);
                this.read(file);
                //this.read(response.data);

            }, (response) => {
                // Error
                console.log("RES ERROR STATUS: ", response.status);
                console.log("RES ERROR DATA", response.data || "Request failed");
            });
        }

        read(file) {

            var reader = new FileReader();

            reader.onloadend = (event: FileReaderEvent) => {

                console.log("EVENT SIZE", event.size);
                console.log("LOAD END: ", event);

                var view = new jDataView(event.target.result, 0);
                //var view = new jDataView(file, 0);
                var pattern = new Pattern();

                dstRead(view, pattern);

                pattern.moveToPositive();
                pattern.drawShape(<HTMLCanvasElement>document.getElementById('mycanvas'));

                console.log("VIEW", view);
            }

            reader.readAsArrayBuffer(file);

            console.log("FILE", file);
            console.log("FILE NAME", file.name);
        }
    }

    

    patchModule
        .run((PatchReader) => {})
        .service("PatchReader", PatchReader);
}