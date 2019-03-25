export declare namespace StatsDHelper {
    type hrTime = [number, number];
    function convertHRTimeToMilliseconds(hrTime: hrTime): number;
    function computeTimingAndSend(hrTimeStart: hrTime, statsdClient: any, statsKey: any, tags?: any): void;
}
