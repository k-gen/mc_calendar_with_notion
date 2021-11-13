import { notion } from '../config/index.js'
import { UnknownHTTPResponseError } from "@notionhq/client"
import { DatePropertyValue, Page, TitlePropertyValue } from '@notionhq/client/build/src/api-types'
import dayjs, { Dayjs } from 'dayjs'
import holiday_jp from '@holiday-jp/holiday_jp'

/**
 * 引数の日付が休日であるか判定
 * @param date - date
 * @returns 引数の日付が休日ならtrue
 */
const isHoliday = (date: string): boolean => {
    const isSaturday = dayjs(date).day() === 6
    const isSunday = dayjs(date).day() === 0
    return holiday_jp.isHoliday(new Date(date)) || isSaturday || isSunday
}

/**
 * 対象のDateプロパティの値が今日の日付と一致しているか判定
 * @param pageId - page_id
 * @param today - YYYY-MM-DD
 * @returns Dateプロパティとtodayの値が一致していればtrue
 */
export const isToday = async (pageId: string, today: string): Promise<boolean> => {
    try {
        const response = await notion.pages.retrieve({
            page_id: pageId,
        });
        return (response.properties.Date as DatePropertyValue).date?.start === today
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 平日のリストを取得
 * @param dayjs
 * @returns 平日のリスト
 */
export const getWeekdays = (dayjs: Dayjs): string[] => {
    let weekdays:string[] = []
    for (let i = 0; i < dayjs.daysInMonth(); i++) {
        let date = dayjs.add(i, 'day')
        let formattedDate = date.locale('ja').format('YYYY-MM-DD')
        if (!isHoliday(formattedDate) && dayjs.month() === date.month()) {
            weekdays.push(formattedDate)
        }
    }
    return weekdays
}

/**
 * 差分コンテンツの取得
 * @param pages - ページオブジェクトの一覧
 * @param diff - 当月の平日数と行数(人数)の差
 * @returns 差分コンテンツのタイトルのリスト
 */
export const getDiffContents = (pages: Page[], diff: number): string[] => {
    return pages.slice(0, diff).map(page => {
        return (page.properties.Name as TitlePropertyValue).title[0].plain_text
    })
}
