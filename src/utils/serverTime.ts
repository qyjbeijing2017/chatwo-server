import moment from "moment-timezone";
import { serverTimeZone } from "../serverConfig";

export function getServerTime(): moment.Moment {
    return moment().tz(serverTimeZone);
}