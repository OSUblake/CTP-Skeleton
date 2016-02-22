namespace CTP.dashboard {

    import PatchService = patch.PatchService;

    class DashboardController {

        foo = "Im a dashboard";

        files = [];

        constructor(
            private logger: ILogger,
            private Upload: IUploadService,
            private PatchService: PatchService) {
            
        }

        upload(files) {

            this.logger.info("DASHBOARD UPDLOAD", files);
        }
    }

    dashboardModule
        .controller("DashboardController", DashboardController);
}