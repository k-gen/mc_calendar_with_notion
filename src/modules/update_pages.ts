import { notion, databaseId } from '../config/index.js'
import { TitlePropertyValue, Page } from '@notionhq/client/build/src/api-types'
import { PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints";
import { UnknownHTTPResponseError } from "@notionhq/client"
import { isToday } from '../utils/index.js'
import { queryNextMC, queryClonePage } from './query_pages.js'

/**
 * 日直当番の日付を各行のDateプロパティに追加
 * @returns PagesUpdateResponse
 */
export const updateContentOfDate = async (pages: Page[], weekdays: string[]): Promise<PagesUpdateResponse[]> => {    
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
export const updateContentOfTodayTags = async (pages: Page[], today: string): Promise<PagesUpdateResponse[]> => {
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
 * 次回の日直にタグを追加
 * @returns PagesUpdateResponse
 */
export const updateContentOfNextTimeTags = async (today: string): Promise<PagesUpdateResponse> => {
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
 * 複製されたページに名前を設定
 * @param diffContents 
 * @returns 
 */
export const updateContentOfName = async (diffContents: string[]): Promise<PagesUpdateResponse[]> => {
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
 * 月が替わる際に重複するページを削除
 * @param pages 
 * @param diffContens 
 * @returns 
 */
export const deletePages = async (pages: Page[]): Promise<(PagesUpdateResponse | undefined)[]> => {
    try {
        // 削除対象のページ一覧を初期化
        let deletePages: Page[] = []
        // 複製ページ一覧を取得
        const clonePages = await queryClonePage()
        // 複製ページが存在する場合はカレンダーの先頭がずれた分の複製のチェックを外す
        if (clonePages.length) {
            // クローンされた行の最後のコンテンツの名前（翌月の最初の営業日）
            const targetName = (clonePages.slice(-1)[0].properties.Name as TitlePropertyValue).title[0].plain_text
            pages.some( (page, index) => {
                const name = (page.properties.Name as TitlePropertyValue).title[0].plain_text
                if (name === targetName) {
                    return true
                }
                deletePages.push(page)
                notion.pages.update({
                    page_id: clonePages[index].id,
                    archived: false,
                    properties: {
                        "Clone": {
                            type: "checkbox",
                            checkbox: false
                        }
                    }
                })
            })
        }
        return await Promise.all(
            pages.map( async (page, index) => {
                if (page.id === deletePages[index]?.id) {
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
export const deleteClone = async (): Promise<PagesUpdateResponse[]> => {
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
