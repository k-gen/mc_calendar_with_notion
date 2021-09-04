import { Client, UnknownHTTPResponseError } from "@notionhq/client"
import dotenv from "dotenv"
dotenv.config()
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday.js'
import 'dayjs/locale/ja.js'
dayjs.extend(weekday)

const notion = new Client({ auth: process.env.NOTION_KEY })

const databaseId = process.env.NOTION_DATABASE_ID

/**
 * ページIDのリストを取得
 * @returns {Array} - pageIds
 */
const getPageIds = async () => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId != null ? databaseId : "",
            sorts: [
              {
                property: 'Name',
                direction: 'ascending',
              },
            ],
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
 * Dateカラムのレコードが今日の日付と一致しているかの判定
 * @param {string} pageId - page_id
 * @param {string} today - YYYY-MM-DD
 * @returns {boolean} レコードとtodayが一致しているか
 */
const isMatchOfToday = async (pageId: string, today: string) => {
    try {
        const response = await notion.pages.retrieve({
            page_id: pageId,
        });
        return response.properties.Date.date.start === today
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
    }
}

/**
 * 翌週の日直当番の日付をレコードに追加
 * @returns {void}
 */
const updateContentForDate = async () => {
    try {
        const pageIds = await getPageIds()
        if (pageIds == null || pageIds.length === 0) return
        pageIds.forEach( async (pageId, index) => {            
            const response = await notion.pages.update({
                page_id: pageId,
                archived: false,
                properties: {
                    "Date": {
                        type: 'date',
                        date: {
                            start: dayjs().weekday(index + 8).locale('ja').format('YYYY-MM-DD'),
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

const updateContentForTags = async (today: string) => {
    try {
        const pageIds = await getPageIds()
        if (pageIds == null || pageIds.length === 0) return
        pageIds.forEach( async (pageId) => {               
            if (await isMatchOfToday(pageId, today)) {
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