var CTP;
(function (CTP) {
    var patch;
    (function (patch_1) {
        var patches = [
            "ohio 4in.DST",
            "A06inch.DST",
            "B.DST",
            "football border.DST",
            "football.DST",
            "GONZAGA.DST",
            "leprechaun 5in.DST",
            "O 5 INCH.DST",
            "ohio 4in.DST",
            "ohio state border.DST" // 9
        ].map(function (patch) { return ("patches/" + patch); });
        function seedSamples($http, logger, PatchService) {
            $http({
                method: "GET",
                //url: "patches/B.DST",
                url: patches[6],
                responseType: "arraybuffer"
            }).then(function (response) { return PatchService.createPatch(new Blob([response.data])); }, function (response) { return logger.error("Load patch", response.data || "Request failed"); });
        }
        patch_1.patchModule.run(seedSamples);
    })(patch = CTP.patch || (CTP.patch = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=seed-samples.js.map