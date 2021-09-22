import { Client, UnknownHTTPResponseError } from "@notionhq/client"
import { DatePropertyValue, TitlePropertyValue, SelectPropertyValue } from '@notionhq/client/build/src/api-types'
import { PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints";
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
 * 差分コンテンツの取得
 * @param {number} diff - 当月の平日数とレコード行数の差
 * @returns {Array<string>} 差分コンテンツのタイトル名
 */
const getDiffContents = async (diff: number) => {
    const pageIds = await getPageIds()
    const diffPageIds = pageIds?.slice(-diff)
    try {
        const response = await notion.databases.query({
            database_id: databaseId ? databaseId : ''
        })
        const diffContent = response.results.filter(result => {
            return diffPageIds?.includes(result.id)
        }).map(result => {
            const titleProperty = result.properties.Name as TitlePropertyValue
            return titleProperty.title[0].plain_text
        })
        return diffContent
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
    }
}

/**
 * 差分コンテンツをデータベースに追加
 * @param {Array <string>} diffContents - 差分コンテンツのタイトル名
 * @returns {Promise<void>}
 */
const createContent = (diffContents: string[]) => {
    return new Promise<void>((resolve, reject) => {
        try {
            diffContents?.map(async diffcontent => {
                const response = await notion.pages.create({
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
                console.log('Create done!');
                resolve()
            });
        } catch (error) {
            if (error instanceof UnknownHTTPResponseError) {
                console.log(error.body)
                reject()
            }
        }
    })
}

/**
 * 日直当番の日付をレコードに追加
 * @returns {void}
 */
const updateContentOfDate = async () => {
    // 各レコード行のidを取得
    const pageIds = await getPageIds()
    // pageIdsが取得できなかった場合は早期リターン
    if (pageIds == null || pageIds.length === 0) return
    // 当月の平日一覧を取得
    let weekdays = getWeekdays(dayjs().date(1))
    // 平日数がレコード行数に満たない場合は来月分も取得
    if (pageIds.length > weekdays.length) {
        let weekdaysInNextMonth = getWeekdays(dayjs().date(1).add(1, 'month'))
        weekdays = [...weekdays,...weekdaysInNextMonth]
    } else if ( weekdays.length > pageIds.length ) {
        // 平日数がレコード行数より多い場合は不足分のレコードを追加作成
        const diff = weekdays.length - pageIds.length
        if (diff <= 0) return
        const diffContents = await getDiffContents(diff)
        if (diffContents == null) return
        await createContent(diffContents)
    }
    
    try {
        // 追加分を含めた各レコード行のidを再取得
        const allPageIds = await getPageIds()
        
        // 各レコード行に日付を追加
        allPageIds?.forEach( async (pageId, index) => {
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
            return response
        });
        console.log("Success! Updated date.")
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
const updateContentOfTodayTags = async (today: string) => {
    const pageIds = await getPageIds()
    return new Promise<void>((resolve, reject) => {
        try {
            pageIds?.forEach( async (pageId) => {
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
                    resolve()
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
                }
            });
            console.log("Success! Updated tags.")
        } catch (error) {
            if (error instanceof UnknownHTTPResponseError) {
                console.log(error.body)
                reject()
            }
        }
    })
    
}

/**
 * 次回の日直を取得
 * @returns {Promise<Page | undefined>} 次回の日直
 */
const queryNextMC = async () => {
    try {
        const res = await notion.databases.query({
            database_id: databaseId != null ? databaseId : "",
            sorts: [
                {
                    property: "Date",
                    direction: "ascending"
                }
            ]
        });
        let target = res.results[0]
        res.results.reduce((acc, current) => {
            if ((acc.properties.Tags as SelectPropertyValue).select?.name === "日直") {
                target = current
            }
            return current
        })
        return target
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
    }
}

/**
 * 次回の日直にタグを追加
 * @returns {Promise<PagesUpdateResponse | undefined>}
 */
const updateContentOfNextTimeTags = async () => {
    const target = await queryNextMC()
    if (target == null) return
    try {
        const response = await notion.pages.update({
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
        console.log("Success! Updated next MC.")
        return response
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
    }
}

(async () => {
    await updateContentOfDate()
    await updateContentOfTodayTags(dayjs().format('YYYY-MM-DD'))
    await updateContentOfNextTimeTags()
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