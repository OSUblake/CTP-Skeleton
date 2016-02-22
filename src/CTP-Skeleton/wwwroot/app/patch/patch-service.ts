namespace CTP.patch {
    
    export class PatchService {

        patches = [];

        constructor(
            private $http: IHttpService,
            private logger: ILogger,
            private dstRead: dstRead) {
            
        }

        createPatch(file) {
            
            var canvas = document.querySelector("#mycanvas3") as HTMLCanvasElement;

            var reader = new FileReader();

            reader.onloadend = (event: FileReaderEvent) => {

                var view = new jDataView(event.target.result, 0);
                var pattern = new Pattern();

                this.dstRead(view, pattern);

                pattern.moveToPositive();
                pattern.drawShape(canvas);

                this.render(pattern);
            }

            reader.readAsArrayBuffer(file);
        }

        render(pattern: Pattern) {
            
            _.forEach(pattern._stitches, layer => {

                var canvas  = document.createElement("canvas");
                var context = canvas.getContext("2d");

                canvas.className = "test-canvas";
                $("body").append(canvas);

                canvas.width = pattern.right;
                canvas.height = pattern.bottom;

                _.forEach(layer, stitch => {
                    
                    if (stitch.flags === StitchType.Jump ||
                        stitch.flags === StitchType.Trim ||
                        stitch.flags === StitchType.Stop) {
                        
                        context.stroke();
                        const color = pattern.colors[stitch.color];
                        context.beginPath();

                        context.strokeStyle = "black";
                        context.moveTo(stitch.x, stitch.y);
                    }

                    context.lineTo(stitch.x, stitch.y);
                });

                context.stroke();
            });
        }
    }

    patchModule
        .service("PatchService", PatchService);
}