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
 * ページの一覧を取得
 * @returns Pageの配列
 */
const queryPages = async (): Promise<Page[]> => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId != null ? databaseId : "",
            sorts: [
                {
                    property: "Clone",
                    direction: "ascending"
                },
                {
                    property: "Date",
                    direction: "ascending"
                }
            ]
        });
        const pages = response.results.map(result => {
            return result
        })
        return pages
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
const queryDiffContents = async (pages: Page[], diff: number): Promise<string[]> => {
    try {
        // cloneされた行を取得
        const clonePages = await queryClonePage()
        if(clonePages.length) {
            return pages.map(page => {
                return (page.properties.Name as TitlePropertyValue).title[0].plain_text
            }).slice(clonePages.length, clonePages.length + diff) // slice(15, 20) // ゆうき, やすひこ, ももこ, ののか
        } else {
            return pages.slice(0, diff).map(page => {
                return (page.properties.Name as TitlePropertyValue).title[0].plain_text
            })
        }
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
            diffContents.map(async (diffContent, index) => {
                const response = notion.pages.create({
                    parent: { database_id: databaseId ? databaseId : ''},
                    properties: {
                        "Clone": {
                            type: "checkbox",
                            checkbox: true
                        }
                    }
                })
                console.log(`${diffContent}copy${index} id added!`);
                return response
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
 * 複製されたページに名前を設定
 * @param diffContents 
 * @returns 
 */
const updateContentOfName = async (diffContents: string[]): Promise<PagesUpdateResponse[]> => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId ? databaseId : '',
            filter: {
                property: "Clone",
                checkbox: {
                    equals: true
                }
            }
        })
        return await Promise.all(
            diffContents.map( async (diffContent, index) => {
                return await notion.pages.update({
                    page_id: response.results[index].id,
                    archived: false,
                    properties: {
                        title: {
                            type: "title",
                            title: [{
                                "type": "text",
                                "text": {
                                    "content": diffContent
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
 * 複製されたページの一覧を取得
 * @returns 
 */
const queryClonePage = async (): Promise<Page[]> => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId ? databaseId : '',
            filter: {
                property: "Clone",
                checkbox: {
                    equals: true
                }
            }
        })
        return response.results
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 削除対象とするページの一覧を取得
 * @param pages 
 * @returns 
 */
const queryDeletePages = async (pages: Page[]): Promise<Page[] | undefined> => {
    try {
        const clonePages = await queryClonePage()
        if (clonePages.length === 0) return
        // クローンされた行の最後のコンテンツの名前（翌月の最初の営業日）
        const targetName = (clonePages.slice(-1)[0].properties.Name as TitlePropertyValue).title[0].plain_text
        // 削除対象のページ一覧を検査
        let deletePages: Page[] = []
        pages.some( page => {
            const name = (page.properties.Name as TitlePropertyValue).title[0].plain_text
            if (name === targetName) {
                return true
            }
            deletePages.push(page)
        })
        return deletePages
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }   
}

/**
 * 月が替わる際に重複するページを削除
 * @param pages 
 * @param diffContens 
 * @returns 
 */
const deletePages = async (pages: Page[], diffContens: string[]): Promise<(PagesUpdateResponse | undefined)[]> => {
    try {
        // 削除対象のページ一覧を取得
        const deletePages = await queryDeletePages(pages)
        // 削除対象のページが0の場合（最初と最後が同じ名前の場合）Cloneのcheckboxをリセットする
        if (deletePages?.length === 0) {
            const cloneIds = (await queryClonePage()).map(page => {
                return page.id
            })
            // Cloneのcheckboxをリセット
            await Promise.all(cloneIds.map( async cloneId => {
                const response = await notion.pages.update({
                    page_id: cloneId,
                    archived: false,
                    properties: {
                        "Clone": {
                            type: "checkbox",
                            checkbox: false
                        }
                    }
                })
                return response
            }))
            // 複製ページの最終行が先頭と重複しているため削除
            await notion.pages.update({
                page_id: cloneIds.slice(-1)[0],
                archived: true,
                properties: {}
            })
        }
        // 最初の行のコンテンツの名前
        const targetName = (pages[0].properties.Name as TitlePropertyValue).title[0].plain_text
        // 複製された行の一覧を取得
        const clonePages = await queryClonePage()
        // 複製行の一覧とページ一覧の最初の行を比較して名前が一致するまで配列に追加する
        clonePages.some(clonePage => {
            const name = (clonePage.properties.Name as TitlePropertyValue).title[0].plain_text
            if (name === targetName) {
                return true
            }
            diffContens.push((clonePage.properties.Name as TitlePropertyValue).title[0].plain_text)
        })
        return await Promise.all(
            pages.map( async (page, index) => {
                if (deletePages != null && page.id === deletePages[index]?.id) {
                    diffContens.push((page.properties.Name as TitlePropertyValue).title[0].plain_text)
                    return await notion.pages.update({
                        page_id: page.id,
                        archived: true,
                        properties: {}
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
 * 複製された行を削除
 * @returns Promise<PagesUpdateResponse[]>
 */
const deleteClone = async (): Promise<PagesUpdateResponse[]> => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId ? databaseId : '',
            filter: {
                property: "Clone",
                checkbox: {
                    equals: true
                }
            }
        })
        return await Promise.all(
            response.results.map( async result => {
                return await notion.pages.update({
                    page_id: result.id,
                    archived: true,
                    properties: {}
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
const updateContentOfDate = async (pages: Page[], weekdays: string[]): Promise<PagesUpdateResponse[]> => {    
    try {
        // 各行に日付を追加
        return await Promise.all(
            pages.map( async (page, index) => {
                return await notion.pages.update({
                    page_id: page.id,
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
const updateContentOfTodayTags = async (pages: Page[], today: string): Promise<PagesUpdateResponse[]> => {
    try {
        return await Promise.all(
            pages.map( async page => {
                if (await isToday(page.id, today)) {
                    return await notion.pages.update({
                        page_id: page.id,
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
                        page_id: page.id,
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

/**
 * 初期化処理
 * @param today 
 * @returns 
 */
const init = async (today: string) => {
    // ページオブジェクト一覧を取得
    let pages = await queryPages()
    // 当月の平日一覧を取得
    let weekdays = getWeekdays(dayjs(today).date(1))
    // 翌月の平日一覧を取得
    const weekdaysInNextMonth = getWeekdays(dayjs(today).date(1).add(1, 'month'))
    // 差分コンテンツの配列を初期化
    let diffContents: string[] = []
    // 月が替わる場合は重複ページ（名前）と複製ページを削除する
    if (dayjs(today).date() === 1) {
        await deletePages(pages, diffContents)
        await deleteClone()
        console.log("Clone contents has deleted!");
        pages = await queryPages()
    }
    // 平日が人数より多い場合はページを複製してカレンダーを埋める
    if (weekdays.length >= pages.length) {
        // 翌月の第1営業日までカレンダーに含めるため差分数に1を加えておく
        const diff = weekdays.length - pages.length - diffContents.length + 1
        diffContents = [...diffContents, ...await queryDiffContents(pages, diff)]
        await createContent(diffContents)
        await updateContentOfName(diffContents)
        console.log(`${diffContents.length} items has created.`);
        // 追加分を含めたページ一覧を再取得
        pages = await queryPages()
    }
    // 配列に翌月の平日を追加
    weekdays = [...weekdays,...weekdaysInNextMonth]

    return {
        pages,
        weekdays
    }
}

export function update (req, res) {
    (async () => {
        const today = dayjs().format('YYYY-MM-DD')
        const {pages, weekdays} = await init(today)
        await updateContentOfDate(pages, weekdays)
        console.log("Success! Updated date.")
        await updateContentOfTodayTags(pages, today)
        console.log("Success! Updated tags.")
        await updateContentOfNextTimeTags(today)
        console.log("Success! Updated next MC.")
        res.send('finish');
    })()
};
