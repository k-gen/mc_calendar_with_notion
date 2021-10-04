import { UnknownHTTPResponseError } from "@notionhq/client"
import { notion } from "../config/index.js"
import { queryClonePage } from "./query_pages.js"

/**
 * 複製のチェックを解除
 * @returns PagesUpdateResponse[]
 */
 export const deleteCheckbox = async () => {
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