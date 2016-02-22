namespace CTP.geom {

    export type SimplifyPath = (points: number[], tolerance?: number, highQuality?: boolean) => number[];

    function distSq(p1x: number, p1y: number, p2x: number, p2y: number) {
        return (p1x - p2x) ** 2 + (p1y - p2y) ** 2;
    }

    function segDistSq(px: number, py: number, p1x: number, p1y: number, p2x: number, p2y: number) {

        var x = p1x;
        var y = p1y;
        var dx = p2x - x;
        var dy = p2y - y;

        if (dx !== 0 || dy !== 0) {
            var t = ((px - x) * dx + (py - y * dy) / (dx * dx + dy * dy));

            if (t > 1) {
                x = p2x;
                y = p2y;
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = px - x;
        dy = py - y;

        return dx * dx + dy * dy;
    }

    function simplifyRadialDist(points: number[], toleranceSq: number) {

        var prevPointX = points[0];
        var prevPointY = points[1];
        var newPoints  = [prevPointX, prevPointY];

        var pointX;
        var pointY;

        for (let i = 2, len = points.length; i < len; i +=2) {

            pointX = points[i + 0];
            pointY = points[i + 1];

            if (distSq(pointX, pointY, prevPointX, prevPointY) > toleranceSq) {

                newPoints.push(pointX, pointY);
                prevPointX = pointX;
                prevPointY = pointY;
            }
        }

        if (prevPointX !== pointX && prevPointY !== pointY) {
            newPoints.push(pointX, pointY);
        }

        return newPoints;
    }

    function simplifyDPStep(
        points: number[],
        first: number,
        last: number,
        toleranceSq: number,
        simplified: number[]) {

        var maxDistSq = toleranceSq;
        var index = 0;

        for (let i = first + 2; i < last; i +=2) {

            var distSq = segDistSq(
                points[i],
                points[i + 1],
                points[first],
                points[first + 1],
                points[last],
                points[last + 1]);

            if (distSq > maxDistSq) {
                index = i;
                maxDistSq = distSq;
            }
        }

        if (maxDistSq > toleranceSq) {
            if (index - first > 1) simplifyDPStep(points, first, index, toleranceSq, simplified);
            simplified.push(points[index], points[index + 1]);
            if (last - index > 1) simplifyDPStep(points, index, last, toleranceSq, simplified);
        }
    }

    function simplifyDouglasPeucker(points: number[], toleranceSq: number) {

        var last = points.length - 2;
        var simplified = [points[0], points[1]];
        simplifyDPStep(points, 0, last, toleranceSq, simplified);
        simplified.push(points[last], points[last + 1]);
        return simplified;
    }


    export function simplifyPath(points: number[], tolerance: number = 10, highQuality: boolean = false) {

        var size = points.length;

        if (size < 5) return;

        var toleranceSq = tolerance ** 2;
        points = highQuality ? points : simplifyRadialDist(points, toleranceSq);
        points = simplifyDouglasPeucker(points, toleranceSq);

        return points;
    }

    geomModule.value("simplifyPath", simplifyPath);
}