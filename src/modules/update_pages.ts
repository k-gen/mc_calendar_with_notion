import { notion } from '../config/index.js'
import { Page, TitlePropertyValue } from '@notionhq/client/build/src/api-types'
import { PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints";
import { UnknownHTTPResponseError } from "@notionhq/client"
import { isTodayPage } from '../utils/index.js'
import { queryNextMC, queryClonePage } from './query_pages.js'
import { Dayjs } from 'dayjs';

/**
 * 日直当番の日付を各行のDateプロパティに追加
 * @param pages
 * @param weekdays
 * @returns PagesUpdateResponse[]
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
 * @param pages
 * @param today - YYYY-MM-DD
 * @returns PagesUpdateResponse[]
 */
export const updateContentOfTodayTags = async (pages: Page[], today: Dayjs): Promise<PagesUpdateResponse[]> => {
    try {
        return await Promise.all(
            pages.map( async page => {
                if (await isTodayPage(page.id, today)) {
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
 * @param today
 * @returns PagesUpdateResponse
 */
export const updateContentOfNextTimeTags = async (today: Dayjs): Promise<PagesUpdateResponse> => {
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
 * ソート結果に合わせて名前を更新
 * @param pages
 * @param sortPages
 * @returns PagesUpdateResponse[]
 */
export const updateContentOfName = async (pages: Page[], sortPages: Page[]): Promise<PagesUpdateResponse[]> => {
    try {
        return await Promise.all(
            pages.map(async (page, index) => {
                return await notion.pages.update({
                    page_id: page.id,
                    archived: false,
                    properties: {
                        title: {
                            type: "title",
                            title: [{
                                "type": "text",
                                "text": {
                                    "content": (sortPages[index].properties.Name as TitlePropertyValue).title[0].plain_text
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
 * 複製されたページに名前を設定
 * @param diffContents
 * @returns PagesUpdateResponse[]
 */
export const updateNameOfClonePage = async (diffContents: string[]): Promise<PagesUpdateResponse[]> => {
    try {
        const clonePages = await queryClonePage()
        return await Promise.all(
            diffContents.map( async (diffContent, index) => {
                return await notion.pages.update({
                    page_id: clonePages[index].id,
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
