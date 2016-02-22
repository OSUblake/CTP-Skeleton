namespace CTP {

    export type IHttpService = angular.IHttpService;
    export type ILogService = angular.ILogService;

    export type IUploadService = angular.angularFileUpload.IUploadService;

    export interface FileReaderEventTarget extends EventTarget {
        result: ArrayBuffer;
    }

    export interface FileReaderEvent extends ProgressEvent {
        target: FileReaderEventTarget;
        //size: number;
    }


    //export interface IHttpService extends angular.IHttpService {
        
    //}
}

//type Buffer = NodeBuffer | ArrayBuffer;

declare class jDataView {

    byteLength: number;
    compatibility: {};

    constructor(buffer: ArrayBuffer, byteOffset?: number, byteLength?: number, littleEndian?: boolean);

    getUint8(): number;
    tell();
    seek(byteOffset: number);
}