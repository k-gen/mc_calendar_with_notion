import holiday_jp from "@holiday-jp/holiday_jp";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ja.js";

// import timezone from "dayjs/plugin/timezone.js";
import timezone from "dayjs/plugin/timezone";
// import utc from "dayjs/plugin/utc.js";
import utc from "dayjs/plugin/utc";
// import weekday from "dayjs/plugin/weekday.js";
import weekday from "dayjs/plugin/weekday";

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(weekday);

const SATURDAY = 6;
const SUNDAY = 0;

/**
 * 引数の日付が休日であるか判定
 * @param {string} dateChar - date
 * @returns {boolean} 休日ならtrue
 */
export const isHoliday = (dateChar: string): boolean => {
  const isSaturday = dayjs(dateChar).day() === SATURDAY;
  const isSunday = dayjs(dateChar).day() === SUNDAY;
  return holiday_jp.isHoliday(new Date(dateChar)) || isSaturday || isSunday;
};

/**
 * 平日のリストを取得
 * @param dayjs
 * @returns {Array<string>} weekdays
 */
export const getWeekdays = (dayjs: Dayjs): Array<string> => {
  const weekdays: string[] = [];
  for (let i = 0; i < dayjs.daysInMonth(); i++) {
    const date = dayjs.add(i, "day");
    const formattedDate = date.locale("ja").format("YYYY-MM-DD");
    if (!isHoliday(formattedDate) && dayjs.month() === date.month()) {
      weekdays.push(formattedDate);
    }
  }
  return weekdays;
};
