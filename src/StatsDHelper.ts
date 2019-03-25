export namespace StatsDHelper {
    type hrTime = [number, number];

    export function convertHRTimeToMilliseconds(hrTime: hrTime): number {
        return hrTime[0] * 1000 + hrTime[1] / 1000000;
    }

    export function computeTimingAndSend(hrTimeStart: hrTime, statsdClient, statsKey, tags?): void {
        if (statsdClient) {
            const processMessageEndTime = process.hrtime(hrTimeStart);
            const totalTimeInMilliseconds = convertHRTimeToMilliseconds(processMessageEndTime);
            statsdClient.timing(statsKey, totalTimeInMilliseconds, tags);
        }
    }
}