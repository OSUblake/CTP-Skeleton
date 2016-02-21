namespace CTP.patch {

    enum StitchType {
        Normal = 0,
        Jump = 1,
        Trim = 2,
        Stop = 4,
        End = 8
    }

    function decodeExp(b2) {
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

        var flags;
        var x;
        var y;

        //var prevJump = false;
        //var thisJump = false;

        var prevJump = 0;
        var thisJump = 0;

        var b = [];
        var byteCount = file.byteLength;

        file.seek(512);

        while (file.tell() < (byteCount - 3)) {

            b[0] = file.getUint8();
            b[1] = file.getUint8();
            b[2] = file.getUint8();

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

            flags = decodeExp(b[2]);
            thisJump = flags & StitchType.Jump;

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
        hoop = {};
        lastX = 0;
        lastY = 0;
        top = 0;
        bottom = 0;
        left = 0;
        right = 0;
        currentColorIndex = 0;

        constructor() {
            
        }

        addColorRgb(r, g, b, description) {
            this.colors[this.colors.length] = new Color(r, g, b, description);
        }

        addColor(color) {
            this.colors[this.colors.length] = color;
        }

        addStitchAbs(x, y, flags, isAutoColorIndex) {

            if ((flags & StitchType.End) === StitchType.End) {
                this.calculateBoundingBox();
                this.fixColorCount();
            }
            
            if (((flags & StitchType.Stop) === StitchType.Stop) && this.stitches.length === 0) {
                return;
            }

            if (((flags & StitchType.Stop) === StitchType.Stop) && isAutoColorIndex) {
                this.currentColorIndex += 1;
            }

            this.stitches[this.stitches.length] = new Stitch(x, y, flags, this.currentColorIndex);
        }

        addStitchRel(dx, dy, flags, isAutoColorIndex) {

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

                    var currentStitch = this.stitches[i];

                    if (currentStitch.flags === StitchType.Jump ||
                        currentStitch.flags === StitchType.Trim ||
                        currentStitch.flags === StitchType.Stop) {

                        ctx.stroke();
                        const color = this.colors[currentStitch.color];
                        ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;
                        ctx.moveTo(currentStitch.x, currentStitch.y);
                    }

                    ctx.lineTo(currentStitch.x, currentStitch.y);
                }
                ctx.stroke();
            }
        }
    }


    class PatchReader {

        constructor($http: IHttpService) {

            $http({
                method: "GET",
                //url: "/patches/ohio4in.DST"
                url: "patches/ohio 4in.DST",
                responseType: "arraybuffer"
            }).then(response => {

                console.log("RESPONSE", response);
                console.log("RES SUCCESS STATUS: ", response.status);
                //console.log("RES SUCCESS DATA", response.data);

                var file = new Blob([(response)], { type: "application/octet-binary" });
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

            reader.onloadend = (p) => {
                console.log("LOAD END: ", p);
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