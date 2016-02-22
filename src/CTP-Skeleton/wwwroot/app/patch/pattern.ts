namespace CTP.patch {

    //export interface IPatternColor {
    //    r: number;
    //    g: number;
    //    b: number;
    //    description: string;
    //}

    //export interface IPatternStitch {
        
    //}

    export interface IPattern {

        new ();

        currentColorIndex: number;
        colors: number;
        stitches: number;
        top: number;
        bottom: number;
        left: number;
        right: number;
        lastX: number;
        lastY: number;
        
        addColorRgb(r: number, g: number, b: number, description: string);
        addColor(color: Color);
        addColorRandom();
        addStitchAbs(x: number, y: number, flags: number, isAutoColorIndex: boolean);
        addStitchRel(dx: number, dy: number, flags: number, isAutoColorIndex: boolean);
        calculateBoundingBox();
        drawShape(canvas: HTMLCanvasElement);
        fixColorCount();
        moveToPositive();
        invertPatternVertical();
    }

    export class Color {
        constructor(
            public r: number,
            public g: number,
            public b: number,
            public description: string) {
        }
    }

    export class Stitch {
        constructor(
            public x: number,
            public y: number,
            public flags: number,
            public color: number) {
        }
    }

    export class Pattern {

        currentColorIndex: number = 0;

        colors: Array<Color>    = [];
        stitches: Array<Stitch> = [];
        
        _stitches: Array<Stitch[]> = [];

        //////
        layers: Array<number[]> = [];

        top: number    = 0;
        bottom: number = 0;
        left: number   = 0;
        right: number  = 0;
        lastX: number  = 0;
        lastY: number  = 0;
        
        constructor() {

        }

        addColorRgb(r: number, g: number, b: number, description: string) {
            this.colors[this.colors.length] = new Color(r, g, b, description);
        }

        addColor(color: Color) {
            this.colors[this.colors.length] = color;
        }

        addStitchAbs(x: number, y: number, flags: number, isAutoColorIndex: boolean) {

            if ((flags & StitchType.End) === StitchType.End) {
                this.calculateBoundingBox();
                this.fixColorCount();
            }

            if (((flags & StitchType.Stop) === StitchType.Stop) && this.stitches.length === 0) {
                return;
            }

            if (((flags & StitchType.Stop) === StitchType.Stop) && isAutoColorIndex) {
                this.currentColorIndex += 1;

                this.layers.push([]);
                this._stitches.push([]);
            }

            if (!this.layers.length) {
                this.layers.push([]);
            }

            if (!this._stitches.length) {
                this._stitches.push([]);
            }

            _.last(this.layers).push(x, y);
            _.last(this._stitches).push(new Stitch(x, y, flags, this.currentColorIndex));

            this.stitches[this.stitches.length] = new Stitch(x, y, flags, this.currentColorIndex);
        }

        addStitchRel(dx: number, dy: number, flags: number, isAutoColorIndex: boolean) {
            
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
            this.left = Number.MAX_VALUE;
            this.top = Number.MAX_VALUE;
            this.right = Number.MIN_VALUE;
            this.bottom = Number.MIN_VALUE;

            for (let i = 0; i < stitchCount; i++) {
                pt = this.stitches[i];

                if (!(pt.flags & StitchType.Trim)) {

                    this.left = this.left < pt.x ? this.left : pt.x;
                    this.top = this.top < pt.y ? this.top : pt.y;
                    this.right = this.right > pt.x ? this.right : pt.x;
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

            _.forEach(this._stitches, layer => {
                _.forEach(layer, stitch => {
                    stitch.x -= this.left;
                    stitch.y -= this.top;
                });
            });

            _.forEach(this.layers, layer => {

                var len = layer.length;
                for (let i = 0; i < len; i += 2) {
                    layer[i + 0] -= this.left;
                    layer[i + 1] -= this.top;
                }
            });

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

            _.forEach(this._stitches, layer => {
                _.forEach(layer, stitch => {
                    stitch.y *= -1;
                });
            });

            _.forEach(this.layers, layer => {

                var len = layer.length;
                for (let i = 1; i < len; i += 2) {
                    layer[i] *= -1;
                }
            });

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

                    let currentStitch = this.stitches[i];
                    
                    if (currentStitch.flags === StitchType.Jump ||
                        currentStitch.flags === StitchType.Trim ||
                        currentStitch.flags === StitchType.Stop) {

                        ctx.stroke();
                        const color = this.colors[currentStitch.color];
                        ctx.beginPath();
                        
                        ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;
                        ctx.moveTo(currentStitch.x, currentStitch.y);
                    }

                    ctx.lineTo(currentStitch.x, currentStitch.y);
                }
                
                ctx.stroke();
            }
        }
    }

    function createPattern(dstRead: dstRead) {
        return (buffer: ArrayBuffer, canvas: HTMLCanvasElement) => {

            var view = new jDataView(buffer, 0);
            var pattern = new Pattern();

            dstRead(view, pattern);
            pattern.moveToPositive();
            pattern.drawShape(canvas);

            return pattern;
        }
    }

    function patternFactory() {
        return Pattern;
    }
    
    //patchModule.constant("Pattern", Pattern);
        //.factory("createPattern", createPattern)
        //.service("Pattern", Pattern)

    //patchModule.factory("Pattern", patternFactory)
        //.service("PatternService", Pattern)
    //patchModule.factory("Pattern", () => Pattern);
}