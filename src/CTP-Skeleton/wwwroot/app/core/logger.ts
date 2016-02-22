namespace CTP {

    type LoggerType = (message: string, data?: {}, title?: string) => void;

    export interface ILogger {
        error:   LoggerType;
        info:    LoggerType;
        success: LoggerType;
        warning: LoggerType;
        log(...args: any[]);
    }
    
    export namespace core {
        
        class Logger implements ILogger {
            
            error:   LoggerType;
            info:    LoggerType;
            success: LoggerType;
            warning: LoggerType;

            constructor(private $log: ILogService) {
                
                function base(type: string, heading: string, message: string, data?: {}, title?: string) {

                    heading += `: ${message}`;

                    if (!data)  return $log[type](heading);
                    if (!title) return $log[type](heading, "\nDetails:", data);
                    return $log[type](heading, "\nSummary:", title, "\nDetails:", data);
                }

                this.error   = _.partial(base, "error", "Error");
                this.info    = _.partial(base, "info", "Info");
                this.success = _.partial(base, "info", "Success");
                this.warning = _.partial(base, "warn", "Warning");
            }

            log(...args: any[]) {
                this.$log.log(args);
            }
        }

        coreModule.service("logger", Logger);
    }
}
