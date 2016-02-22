var CTP;
(function (CTP) {
    var core;
    (function (core) {
        core.coreModule = angular.module(CTP.appName + ".core", [
            (CTP.appName + ".geom"),
            (CTP.appName + ".patch"),
            (CTP.appName + ".utils"),
            (CTP.appName + ".layout"),
            (CTP.appName + ".dashboard"),
            (CTP.appName + ".renderer"),
        ]);
    })(core = CTP.core || (CTP.core = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=core.module.js.map