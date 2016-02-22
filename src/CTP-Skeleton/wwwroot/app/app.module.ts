namespace CTP {

    export const appName = "ctp";

    export const appModule = angular.module("ctp", [
        "ui.router",
        "ngMaterial",
        "ctp.core",
        "ngFileUpload"
        //"ctp.patch"
    ]);
}