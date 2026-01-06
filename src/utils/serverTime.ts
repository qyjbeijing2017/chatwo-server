import * as moment from 'moment-timezone';

export function getServerTime(): moment.Moment {
    return moment().tz(process.env.TIMEZONE || "UTC");
}

export function todayStart() {
    const serverTime = getServerTime();
    serverTime.startOf('day');
    return serverTime.toDate();
}