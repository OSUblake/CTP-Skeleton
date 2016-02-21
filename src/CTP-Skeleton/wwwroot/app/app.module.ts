namespace CTP {

    export const appModule = angular.module("ctp", [
        "ui.router",
        "ngMaterial",
        "ctp.core",
        "ctp.patch"
    ]);
}