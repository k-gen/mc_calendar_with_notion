import { notion, databaseId } from '../config/index.js'
import { TitlePropertyValue, Page } from '@notionhq/client/build/src/api-types'
import { PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints";
import { UnknownHTTPResponseError } from "@notionhq/client"
import { isToday } from '../utils/index.js'
import { queryNextMC, queryClonePage, queryDeletePages } from './query_pages.js'

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
export const deletePages = async (pages: Page[], diffContens: string[]): Promise<(PagesUpdateResponse | undefined)[]> => {
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
