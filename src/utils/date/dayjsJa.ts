import dayjs, { ConfigType } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from "dayjs/plugin/utc"
import weekday from 'dayjs/plugin/weekday'
import 'dayjs/locale/ja'

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(weekday)
dayjs.locale('ja')

declare module 'dayjs' {
  interface Dayjs {
    formatY4M2D2 (): string
    isSameAtDay (date: ConfigType): boolean
  }
}

dayjs.prototype = {
  ...dayjs.prototype,
  formatY4M2D2: function () {
    return this.format('YYYY-MM-DD')
  },
  isSameAtDay: function (date: ConfigType) {
    return this.isSame(date, 'day')
  },
}

export { dayjs as dayjsJa }
