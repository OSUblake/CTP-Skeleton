var CTP;
(function (CTP) {
    var dashboard;
    (function (dashboard) {
        var DashboardController = (function () {
            function DashboardController(logger, Upload, PatchService) {
                this.logger = logger;
                this.Upload = Upload;
                this.PatchService = PatchService;
                this.foo = "Im a dashboard";
                this.files = [];
            }
            DashboardController.prototype.upload = function (files) {
                this.logger.info("DASHBOARD UPDLOAD", files);
            };
            return DashboardController;
        }());
        dashboard.dashboardModule
            .controller("DashboardController", DashboardController);
    })(dashboard = CTP.dashboard || (CTP.dashboard = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=dashboard.controller.js.map