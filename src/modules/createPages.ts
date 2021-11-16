import { notion, databaseId } from "../config/index.js";
import { PagesUpdateResponse } from "@notionhq/client/build/src/api-endpoints";
import { UnknownHTTPResponseError } from "@notionhq/client";
import { updateNameOfClonePage } from "./updatePages.js";
import { queryPages } from "./queryPages.js";

/**
 * 差分コンテンツをデータベースに追加
 * @param diffContents - 差分コンテンツのタイトル名
 * @returns PagesCreateResponse[]
 */
export const createClone = async (
  diffContents: string[]
): Promise<PagesUpdateResponse[]> => {
  try {
    await Promise.all(
      diffContents.map(async diffContent => {
        return notion.pages.create({
          parent: { database_id: diffContent },
          properties: {
            Clone: {
              type: "checkbox",
              checkbox: true,
            },
          },
        });
      })
    );
    await updateNameOfClonePage(diffContents);
    return await queryPages();
  } catch (error) {
    if (error instanceof UnknownHTTPResponseError) {
      console.log(error.body);
    }
    throw error;
  }
};
