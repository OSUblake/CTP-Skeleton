namespace CTP.core {
    
    export const coreModule = angular.module(appName + ".core", [
        `${appName}.geom`,
        `${appName}.patch`,
        `${appName}.utils`,
        `${appName}.layout`,
        `${appName}.dashboard`,
        `${appName}.renderer`,
    ]);
}