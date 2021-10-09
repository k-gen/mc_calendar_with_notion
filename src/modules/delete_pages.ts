import { UnknownHTTPResponseError } from "@notionhq/client"
import { PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints"
import { Page } from "@notionhq/client/build/src/api-types"
import { notion } from "../config/index.js"
import { queryClonePage } from "./query_pages.js"

/**
 * 複製のチェックを解除
 * @returns PagesUpdateResponse[]
 */
 export const deleteCloneCheckbox = async (): Promise<PagesUpdateResponse[]> => {
    try {
        const clonePages = await queryClonePage()
        return Promise.all(clonePages.map(async clonePage => {
            return await notion.pages.update({
                page_id: clonePage.id,
                archived: false,
                properties: {
                    "Clone": {
                        type: "checkbox",
                        checkbox: false
                    }
                }
            })
        }))
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 複製ページを削除
 * @param clonePages 
 * @returns PagesUpdateResponse[]
 */
export const deleteClone = async (clonePages: Page[]): Promise<PagesUpdateResponse[]> => {
    try {
        return await Promise.all(
            clonePages.map(async clonePage => {
                return await notion.pages.update({
                    page_id: clonePage.id,
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