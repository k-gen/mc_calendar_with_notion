import { notion, databaseId } from '../config/index.js'
import { PagesCreateResponse } from "@notionhq/client/build/src/api-endpoints";
import { UnknownHTTPResponseError } from "@notionhq/client"

/**
 * 差分コンテンツをデータベースに追加
 * @param diffContents - 差分コンテンツのタイトル名
 * @returns PagesCreateResponse
 */
export const createContent = async (diffContents: string[]): Promise<PagesCreateResponse[]> => {
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
