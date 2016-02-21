var CTP;
(function (CTP) {
    var core;
    (function (core) {
        var MainController = (function () {
            function MainController() {
                this.msg = "Sup yo???";
            }
            return MainController;
        }());
        core.coreModule.controller("MainController", MainController);
    })(core = CTP.core || (CTP.core = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=core.route.js.map