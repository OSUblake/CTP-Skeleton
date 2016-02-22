var CTP;
(function (CTP) {
    var core;
    (function (core) {
        var Logger = (function () {
            function Logger($log) {
                this.$log = $log;
                function base(type, heading, message, data, title) {
                    heading += ": " + message;
                    if (!data)
                        return $log[type](heading);
                    if (!title)
                        return $log[type](heading, "\nDetails:", data);
                    return $log[type](heading, "\nSummary:", title, "\nDetails:", data);
                }
                this.error = _.partial(base, "error", "Error");
                this.info = _.partial(base, "info", "Info");
                this.success = _.partial(base, "info", "Success");
                this.warning = _.partial(base, "warn", "Warning");
            }
            Logger.prototype.log = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                this.$log.log(args);
            };
            return Logger;
        }());
        core.coreModule.service("logger", Logger);
    })(core = CTP.core || (CTP.core = {}));
})(CTP || (CTP = {}));
//# sourceMappingURL=logger.js.map