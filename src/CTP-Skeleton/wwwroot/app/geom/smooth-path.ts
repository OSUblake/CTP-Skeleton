namespace CTP.geom {

    export type SmoothPath = (points: number[], tension: number, closed: boolean, interpolate: boolean) => number[];

    //export interface SmoothPathConfig {
    //    interpolate: boolean;
    //    closed: boolean;
    //    tension: number;
    //    svg: boolean;
    //    array: boolean;
    //}

    function smoothPath(points: number[], tension: number, closed: boolean = true, interpolate: boolean = false) {
    //function smoothPath(points: number[], config?: SmoothPathConfig) {

        if (!points) return;

        var size = points.length;

        if (size < 3) return;
        if (size < 4) {
            var sameX = (points[0] === points[2]);
            var sameY = (points[1] === points[3]);

            if (sameX && sameY) return;
        }
        
        if (tension == null) tension = 1;

        var last = size - 4;

        var path = `M${points[0]},${points[1]}`;
        var data = [points[0], points[1]];

        var cp1x = 0;
        var cp1y = 0;
        var cp2x = 0;
        var cp2y = 0;

        for (let i = 0; i < size - 2; i += 2) {

            var px0 = i ? i - 2 : closed ? last + 0 : 0;
            var py0 = i ? i - 1 : closed ? last + 1 : 1;

            var px3 = i !== last ? i + 4 : closed ? 2 : i + 2;
            var py3 = i !== last ? i + 5 : closed ? 3 : i + 3;

            var x0 = points[px0];
            var y0 = points[py0];

            //var x0 = i ? points[i - 2] : points[0];
            //var y0 = i ? points[i - 1] : points[1];

            var x1 = points[i + 0];
            var y1 = points[i + 1];

            var x2 = points[i + 2];
            var y2 = points[i + 3];

            var x3 = points[px3];
            var y3 = points[py3];

            //var x3 = i !== last ? points[i + 4] : x2;
            //var y3 = i !== last ? points[i + 5] : y2;
            
            //var x3 = i !== last ? points[i + 4] : x2;
            //var y3 = i !== last ? points[i + 5] : y2;

            if (interpolate) {

                var xc1 = (x0 + x1) / 2;
                var yc1 = (y0 + y1) / 2;
                var xc2 = (x1 + x2) / 2;
                var yc2 = (y1 + y2) / 2;
                var xc3 = (x2 + x3) / 2;
                var yc3 = (y2 + y3) / 2;

                var len1 = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
                var len2 = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                var len3 = Math.sqrt((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2));

                var k1 = len1 / (len1 + len2);
                var k2 = len2 / (len2 + len3);

                var xm1 = xc1 + (xc2 - xc1) * k1;
                var ym1 = yc1 + (yc2 - yc1) * k1;
                var xm2 = xc2 + (xc3 - xc2) * k2;
                var ym2 = yc2 + (yc3 - yc2) * k2;

                cp1x = xm1 + (xc2 - xm1) * tension + x1 - xm1;
                cp1y = ym1 + (yc2 - ym1) * tension + y1 - ym1;
                cp2x = xm2 + (xc2 - xm2) * tension + x2 - xm2;
                cp2y = ym2 + (yc2 - ym2) * tension + y2 - ym2;

                //path += ` C${cp1x},${cp1y},${cp2x},${cp2y},${x2},${y2}`;
                //data.push(cp1x, cp1y, cp2x, cp2y, x2, y2);

            } else {

                cp1x = x1 + (x2 - x0) / 6 * tension;              
                cp1y = y1 + (y2 - y0) / 6 * tension;
                cp2x = x2 - (x3 - x1) / 6 * tension;
                cp2y = y2 - (y3 - y1) / 6 * tension; 

                //path += ` C${cp1x},${cp1y},${cp2x},${cp2y},${x2},${y2}`;
                //data.push(cp1x, cp1y, cp2x, cp2y, x2, y2);
            }

            path += ` C${cp1x},${cp1y},${cp2x},${cp2y},${x2},${y2}`;
            data.push(cp1x, cp1y, cp2x, cp2y, x2, y2);
        }

        return { data, path };
    }

    geomModule.value("smoothPath", smoothPath);
}