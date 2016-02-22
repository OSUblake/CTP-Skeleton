var CTP;
(function (CTP) {
    var geom;
    (function (geom) {
        function distSq(p1x, p1y, p2x, p2y) {
            return Math.pow((p1x - p2x), 2) + Math.pow((p1y - p2y), 2);
        }
        function segDistSq(px, py, p1x, p1y, p2x, p2y) {
            var x = p1x;
            var y = p1y;
            var dx = p2x - x;
            var dy = p2y - y;
            if (dx !== 0 || dy !== 0) {
                var t = ((px - x) * dx + (py - y * dy) / (dx * dx + dy * dy));
                if (t > 1) {
                    x = p2x;
                    y = p2y;
                }
                else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }
            dx = px - x;
            dy = py - y;
            return dx * dx + dy * dy;
        }
        function simplifyRadialDist(points, toleranceSq) {
            var prevPointX = points[0];
            var prevPointY = points[1];
            var newPoints = [prevPointX, prevPointY];
            var pointX;
            var pointY;
            for (var i = 2, len = points.length; i < len; i += 2) {
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
        function simplifyDPStep(points, first, last, toleranceSq, simplified) {
            var maxDistSq = toleranceSq;
            var index = 0;
            for (var i = first + 2; i < last; i += 2) {
                var distSq = segDistSq(points[i], points[i + 1], points[first], points[first + 1], points[last], points[last + 1]);
                if (distSq > maxDistSq) {
                    index = i;
                    maxDistSq = distSq;
                }
            }
            if (maxDistSq > toleranceSq) {
                if (index - first > 1)
                    simplifyDPStep(points, first, index, toleranceSq, simplified);
                simplified.push(points[index], points[index + 1]);
                if (last - index > 1)
                    simplifyDPStep(points, index, last, toleranceSq, simplified);
            }
        }
        function simplifyDouglasPeucker(points, toleranceSq) {
            var last = points.length - 2;
            var simplified = [points[0], points[1]];
            simplifyDPStep(points, 0, last, toleranceSq, simplified);
            simplified.push(points[last], points[last + 1]);
            return simplified;
        }
        function simplifyPath(points, tolerance, highQuality) {
            if (tolerance === void 0) { tolerance = 10; }
            if (highQuality === void 0) { highQuality = false; }
            var size = points.length;
            if (size < 5)
                return;
            var toleranceSq = Math.pow(tolerance, 2);
            points = highQuality ? points : simplifyRadialDist(points, toleranceSq);
            points = simplifyDouglasPeucker(points, toleranceSq);
            return points;
        }
        geom.simplifyPath = simplifyPath;
        geom.geomModule.value("simplifyPath", simplifyPath);
    })(geom = CTP.geom || (CTP.geom = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=simplify-path.js.map