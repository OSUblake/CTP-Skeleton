namespace CTP.patch {

    var patches = [
        "ohio 4in.DST", // 0
        "A06inch.DST", // 1
        "B.DST", // 2
        "football border.DST", // 3
        "football.DST", // 4
        "GONZAGA.DST", // 5
        "leprechaun 5in.DST", // 6
        "O 5 INCH.DST", // 7
        "ohio 4in.DST", // 8
        "ohio state border.DST" // 9
    ].map(patch => `patches/${patch}`);

    function seedSamples($http: IHttpService, logger: ILogger, PatchService: PatchService) {
        
        $http({
            method: "GET",
            //url: "patches/B.DST",
            url: patches[6],
            responseType: "arraybuffer"
        }).then(
            response => PatchService.createPatch(new Blob([response.data])),
            response => logger.error("Load patch", response.data || "Request failed"));
    }

    patchModule.run(seedSamples);
}