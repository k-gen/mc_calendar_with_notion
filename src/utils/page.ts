import { notion } from '../config/index.js'
import { UnknownHTTPResponseError } from "@notionhq/client"
import { DatePropertyValue, Page, TitlePropertyValue } from '@notionhq/client/build/src/api-types'
import { Dayjs } from 'dayjs'

/**
 * 対象のDateプロパティの値が今日の日付と一致しているか判定
 * @param pageId - page_id
 * @param today - YYYY-MM-DD
 * @returns Dateプロパティとtodayの値が一致していればtrue
 */
export const isTodayPage = async (pageId: string, today: Dayjs): Promise<boolean> => {
    try {
        const response = await notion.pages.retrieve({
            page_id: pageId,
        });
        return today.isSame((response.properties.Date as DatePropertyValue).date?.start, 'day')
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
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
