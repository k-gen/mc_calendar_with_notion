import { Client, UnknownHTTPResponseError } from "@notionhq/client"
import { DatePropertyValue, TitlePropertyValue, Page } from '@notionhq/client/build/src/api-types'
import { PagesCreateResponse, PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints";
import dotenv from "dotenv"
dotenv.config()
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ja.js'
import weekday from 'dayjs/plugin/weekday.js'
dayjs.extend(weekday)
import holiday_jp from '@holiday-jp/holiday_jp';

const notion = new Client({ auth: process.env.NOTION_KEY })

const databaseId = process.env.NOTION_DATABASE_ID

/**
 * 各行のID(ページID)のリストを取得
 * @returns pageIdのリスト
 */
const queryPageIds = async (): Promise<string[]> => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId != null ? databaseId : "",
        });
        const pageIds = response.results.map(result => {
            return result.id
        })
        return pageIds
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 対象のDateプロパティの値が今日の日付と一致しているか判定
 * @param pageId - page_id
 * @param today - YYYY-MM-DD
 * @returns Dateプロパティとtodayの値が一致していればtrue
 */
const isToday = async (pageId: string, today: string): Promise<boolean> => {
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
 * 平日のリストを取得
 * @param dayjs
 * @returns 平日のリスト
 */
const getWeekdays = (dayjs: Dayjs): string[] => {
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
 * @param diff - 当月の平日数と行数(人数)の差
 * @returns 差分コンテンツのタイトルのリスト
 */
const queryDiffContents = async (pageIds: string[], diff: number): Promise<string[]> => {
    const diffPageIds = pageIds.slice(-diff)
    try {
        const response = await notion.databases.query({
            database_id: databaseId ? databaseId : ''
        })
        const diffContent = response.results.filter(result => {
            return diffPageIds?.includes(result.id)
        }).map(result => {
            return (result.properties.Name as TitlePropertyValue).title[0].plain_text
        })
        return diffContent
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 差分コンテンツをデータベースに追加
 * @param diffContents - 差分コンテンツのタイトル名
 * @returns PagesCreateResponse
 */
const createContent = async (diffContents: string[]): Promise<PagesCreateResponse[]> => {
    try {
        return await Promise.all(
            diffContents?.map(async diffcontent => {
                return await notion.pages.create({
                    parent: { database_id: databaseId ? databaseId : ''},
                    properties: {
                        title: {
                            type: "title",
                            title: [{
                                "type": "text",
                                "text": {
                                    "content": diffcontent
                                }
                            }]
                        }
                    }
                })
            })
        )
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 日直当番の日付を各行のDateプロパティに追加
 * @returns PagesUpdateResponse
 */
const updateContentOfDate = async (pageIds: string[], weekdays: string[]): Promise<PagesUpdateResponse[]> => {    
    try {
        // 各行に日付を追加
        return await Promise.all(
            pageIds.map( async (pageId, index) => {
                return await notion.pages.update({
                    page_id: pageId,
                    archived: false,
                    properties: {
                        "Date": {
                            type: 'date',
                            date: {
                                start: weekdays[index],
                                end: undefined
                            }
                        }
                    }
                })
            })
        )
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 当日が日直のメンバーにタグを追加する
 * @param today - YYYY-MM-DD
 * @returns PagesUpdateResponse
 */
const updateContentOfTodayTags = async (pageIds: string[], today: string): Promise<PagesUpdateResponse[]> => {
    try {
        return await Promise.all(
            pageIds.map( async pageId => {
                if (await isToday(pageId, today)) {
                    return await notion.pages.update({
                        page_id: pageId,
                        archived: false,
                        properties: {
                            "Tags": {
                                type: 'select',
                                select: {
                                    name: "日直",
                                    color: "gray"
                                }
                            }
                        }
                    })
                } else {
                    return await notion.pages.update({
                        page_id: pageId,
                        archived: false,
                        properties: {
                            "Tags": {
                                type: 'select',
                                select: null
                            }
                        }
                    })
                }
            })
        )
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 次回の日直を取得
 * @returns 次回日直のページオブジェクト
 */
const queryNextMC = async (today: string): Promise<Page> => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId != null ? databaseId : "",
            sorts: [
                {
                    property: "Date",
                    direction: "ascending"
                }
            ]
        });
        let target = response.results[0] // 初期値
        response.results.some((result) => {
            // 今日から直近の平日を日直として変数に代入
            const targetDate = dayjs((result.properties.Date as DatePropertyValue).date?.start)
            const duration = dayjs(today).diff(targetDate, 'day')
            if (duration < 0) {
                target = result
                return true
            }
            return false
        })
        return target
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 次回の日直にタグを追加
 * @returns PagesUpdateResponse
 */
const updateContentOfNextTimeTags = async (today: string): Promise<PagesUpdateResponse> => {
    const target = await queryNextMC(today)
    try {
        return await notion.pages.update({
            page_id: target.id,
            archived: false,
            properties: {
                "Tags": {
                    type: 'select',
                    select: {
                        name: "Next",
                        color: "green"
                    }
                }
            }
        })
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

(async () => {
    const today = dayjs().format('YYYY-MM-DD')
    // 各行のidを取得
    let pageIds = await queryPageIds()
    // 当月の平日一覧を取得
    let weekdays = getWeekdays(dayjs(today).date(1))
    // 平日数が人数に満たない場合は来月分も取得
    if (pageIds.length > weekdays.length) {
        let weekdaysInNextMonth = getWeekdays(dayjs(today).date(1).add(1, 'month'))
        weekdays = [...weekdays,...weekdaysInNextMonth]
    }
    // 平日数が人数より多い場合は不足分を行の先頭から追加して補完
    else if (weekdays.length > pageIds.length) {
        const diff = weekdays.length - pageIds.length
        const diffContents = await queryDiffContents(pageIds, diff)
        await createContent(diffContents)
        console.log(`${diffContents.length} items has created.`);
        // 追加分を含めた各行のidを再取得
        pageIds = await queryPageIds()
    }
    
    await updateContentOfDate(pageIds, weekdays)
    console.log("Success! Updated date.")
    await updateContentOfTodayTags(pageIds, today)
    console.log("Success! Updated tags.")
    await updateContentOfNextTimeTags(today)
    console.log("Success! Updated next MC.")
})()
