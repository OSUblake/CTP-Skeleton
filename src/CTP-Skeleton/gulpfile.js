"use strict";
var gulp = require("gulp");
var browserSync = require("browser-sync");
var reload = browserSync.reload;
gulp.task("serve", function () {
    browserSync.init({
        port: 3000,
        browser: ["google chrome"],
        notify: true,
        logConnections: true,
        logFileChanges: true,
        injectChanges: false,
        files: ["wwwroot/**/*.{ts,css,html}", "!wwwroot/lib/**"],
        logPrefix: "CTP",
        server: {
            baseDir: ["wwwroot"],
            directory: true,
            index: "index.html",
            routes: {
                "/patches": "patches"
            }
        },
        startPath: "index.html",
        reloadOnRestart: true
    });
});
gulp.task("default", ["serve"]);
//# sourceMappingURL=gulpfile.js.map