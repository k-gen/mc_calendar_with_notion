import { Client, UnknownHTTPResponseError } from "@notionhq/client/build/src";
import { DatabasesQueryResponse } from "@notionhq/client/build/src/api-endpoints";
import { DatePropertyValue } from "@notionhq/client/build/src/api-types";
import { Config } from "../config";
import { isDetectiveType } from "../utils";

const { KEY, DATABASE_ID, Props } = Config.Notion;

export class NotionRepository {
  #notion: Client;
  #DATABASE_ID: string;

  constructor() {
    if (!KEY || !DATABASE_ID) throw new Error("Notion config is not set");
    this.#notion = new Client({ auth: KEY });
    this.#DATABASE_ID = DATABASE_ID;
  }

  getPageIds = async () => {
    try {
      const response = (await this.#notion.databases.query({
        database_id: this.#DATABASE_ID,
      })) as DatabasesQueryResponse;
      return response.results.map(result => result.id);
    } catch (error) {
      if (error instanceof UnknownHTTPResponseError) {
        console.error({ error });
      }
    }
  };

  /**
   * 対象レコードのDateカラムの値が今日の日付と一致しているか判定
   * @param {string} pageId - page_id
   * @param {string} today - YYYY-MM-DD
   * @returns {Promise<boolean| undefined>} レコードとtodayが一致しているか
   */
  isToday = async (
    pageId: string,
    todayChar: string
  ): Promise<boolean | undefined> => {
    try {
      const response = await this.#notion.pages.retrieve({
        page_id: pageId,
      });
      if (!(Props.DATE in response.properties))
        throw new Error("Date Prop Name is not found.");
      const datePropName = response.properties[Props.DATE];
      if (!isDetectiveType<DatePropertyValue>(datePropName))
        throw new Error("Date Prop Name is not a Date.");
      if (datePropName.date !== null)
        return datePropName.date.start === todayChar;
    } catch (error) {
      if (error instanceof UnknownHTTPResponseError) {
        console.error({ error });
      }
    }
  };

  updatePageDate = async (pageId: string, dateChar: string) => {
    try {
      return await this.#notion.pages.update({
        page_id: pageId,
        archived: false,
        properties: {
          [Props.DATE]: {
            type: "date",
            date: {
              start: dateChar,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof UnknownHTTPResponseError) {
        console.error({ error });
      }
    }
  };
  updatePageTag = async (pageId: string, isSelectValue: boolean) => {
    try {
      return await this.#notion.pages.update({
        page_id: pageId,
        archived: false,
        properties: {
          [Props.TAGS_NAME]: {
            type: "select",
            select: isSelectValue
              ? {
                  name: Props.TAGS_VALUE,
                }
              : null,
          },
        },
      });
    } catch (error) {
      if (error instanceof UnknownHTTPResponseError) {
        console.error({ error });
      }
    }
  };
}
