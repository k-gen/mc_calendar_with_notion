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
updateContentForDate()

/**
 * ユーザー一覧を取得
 * @returns {void}
 */
// const getUserList = async () => {
//     const response = await notion.users.list();
//     console.log(response);
// };

// getUserList()