import { Client, UnknownHTTPResponseError } from "../node_modules/@notionhq/client"
import { DatePropertyValue } from '../node_modules/@notionhq/client/build/src/api-types'
import dotenv from "../node_modules/dotenv"
dotenv.config()
import dayjs, { Dayjs } from '../node_modules/dayjs';
import '../node_modules/dayjs/locale/ja.js'
import holiday_jp from '../node_modules/@holiday-jp/holiday_jp';

const notion = new Client({ auth: process.env.NOTION_KEY })

const databaseId = process.env.NOTION_DATABASE_ID

/**
 * 各レコード行のID(ページID)のリストを取得
 * @returns {Array} - pageIds
 */
const getPageIds = async () => {
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
    }
}

/**
 * 対象レコードのDateカラムの値が今日の日付と一致しているか判定
 * @param {string} pageId - page_id
 * @param {string} today - YYYY-MM-DD
 * @returns {boolean} レコードとtodayが一致しているか
 */
const isToday = async (pageId: string, today: string) => {
    try {
        const response = await notion.pages.retrieve({
            page_id: pageId,
        });
        const dateProperty = response.properties.Date as DatePropertyValue
        if (dateProperty.date != null) {
            return dateProperty.date.start === today
        }
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
    }
}

/**
 * 引数の日付が休日であるか判定
 * @param {string} date - date
 * @returns {boolean} 休日ならtrue
 */
const isHoliday = (date) => {
    const isSaturday = dayjs(date).day() === 6
    const isSunday = dayjs(date).day() === 0
    return holiday_jp.isHoliday(new Date(date)) || isSaturday || isSunday
}

/**
 * 平日のリストを取得
 * @param dayjs
 * @returns {Array} weekdays
 */
const getWeekdays = (dayjs: Dayjs) => {
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
 * 翌週の日直当番の日付をレコードに追加
 * @returns {void}
 */
const updateContentForDate = async () => {
    try {
        // 各レコード行のidを取得
        const pageIds = await getPageIds()
        if (pageIds == null || pageIds.length === 0) return
        // 当月の平日のみのリストを取得
        let weekdays = getWeekdays(dayjs())
        // 当月の平日の数がレコード行数に満たない場合は来月分も取得
        if (pageIds.length > weekdays.length) {
            let weekdaysInNextMonth = getWeekdays(dayjs().date(1).add(1, 'month'))
            weekdays = [...weekdays,...weekdaysInNextMonth]
        }
        // 各レコード行に日付を追加
        pageIds.forEach( async (pageId, index) => {
            const response = await notion.pages.update({
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
            console.log(response)
        });
        console.log("Success! Update contents.")
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
    }
}

/**
 * 当日が日直のメンバーにタグを追加する
 * @param today
 * @returns {void}
 */
const updateContentForTags = async (today: string) => {
    try {
        const pageIds = await getPageIds()
        if (pageIds == null || pageIds.length === 0) return
        pageIds.forEach( async (pageId) => {
            if (await isToday(pageId, today)) {
                const response = await notion.pages.update({
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
                console.log(response)
            } else {
                const response = await notion.pages.update({
                    page_id: pageId,
                    archived: false,
                    properties: {
                        "Tags": {
                            type: 'select',
                            select: null
                        }
                    }
                })
                console.log(response)
            }
        });
        console.log("Success! Update tags.")
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
    }
}


(async () => {
    await updateContentForDate()
    await updateContentForTags(dayjs().format('YYYY-MM-DD'))
})()

/**
 * ユーザー一覧を取得
 * @returns {void}
 */
// const getUserList = async () => {
//     const response = await notion.users.list();
//     console.log(response);
// };

// getUserList()