import { notion, databaseId } from '../config/index.js'
import { PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints";
import { UnknownHTTPResponseError } from "@notionhq/client"
import { updateNameOfClonePage } from './update_pages.js';
import { queryPages } from './query_pages.js';

/**
 * 差分コンテンツをデータベースに追加
 * @param diffContents - 差分コンテンツのタイトル名
 * @returns PagesCreateResponse[]
 */
export const createClone = async (diffContents: string[]): Promise<PagesUpdateResponse[]> => {
    try {
        await Promise.all(
            diffContents.map(async (diffContent, index) => {
                return notion.pages.create({
                    parent: { database_id: databaseId ? databaseId : ''},
                    properties: {
                        "Clone": {
                            type: "checkbox",
                            checkbox: true
                        }
                    }
                })
            })
        )
        await updateNameOfClonePage(diffContents)
        return await queryPages()
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}
