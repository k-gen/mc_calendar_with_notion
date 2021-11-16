import { Dayjs } from "dayjs"
import { isHoliday as _isHoliday } from '@holiday-jp/holiday_jp'

const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'] as const
type WeekDay = typeof weekdays[number]

/**
 * 引数の日付が休日であるか判定
 * @param date - date
 * @returns 引数の日付が休日ならtrue
 */
const isHoliday = (date: Dayjs): boolean => {
  return _isHoliday(date.toDate()) || matchWeekdays(date, '土曜日', '日曜日')
}

// FIXME rewireを入れて非公開関数にしたい
export const matchWeekdays = (date: Dayjs, ...inputWeekdays: WeekDay[]): boolean => (
  inputWeekdays.some(weekday => weekday === weekdays[date.day()])
)

/**
 * 指定日の月の全ての平日を取得
 * @param dayjs
 * @returns 平日のリスト
 */
export const getWeekdaysByDate = (setDate: Dayjs): Dayjs[] => {
  let weekdays: Dayjs[] = []
  const firstDay = setDate.date(1)

  for (let i = 0; i < setDate.daysInMonth(); i++) {
      let increasedDate = firstDay.add(i, 'day')

      if (setDate.month() !== increasedDate.month()) break
      if (isHoliday(increasedDate)) continue

      weekdays.push(increasedDate)
  }
  return weekdays
}
