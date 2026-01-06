import * as moment from 'moment-timezone';

export function getServerTime(): moment.Moment {
    return moment().tz(process.env.TIMEZONE || "UTC");
}