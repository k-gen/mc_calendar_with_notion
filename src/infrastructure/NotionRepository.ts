import { Client, UnknownHTTPResponseError } from "@notionhq/client/build/src";
import {
  DatabasesQueryParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { DatePropertyValue, Page } from "@notionhq/client/build/src/api-types";
import { Dayjs } from "dayjs";
import { Config } from "../config";
import { NotionRepositoryProps } from "../repository/notion.interface";
import { isDetectiveType } from "../utils";

const { KEY, DATABASE_ID, Props } = Config.Notion;

export class NotionRepository {
  #notion: Client;
  #DATABASE_ID: string;

  // FIXME process.envをmock化しても反映されなかった為引数でDIしてる
  constructor(
    { _KEY, _DATABASE_ID }: NotionRepositoryProps = { _KEY: KEY, _DATABASE_ID: DATABASE_ID }
  ) {
    if (!_KEY || !_DATABASE_ID) throw new Error("Notion config is not set");
    this.#notion = new Client({ auth: _KEY });
    this.#DATABASE_ID = _DATABASE_ID;
  }

  // TODO rewire使ってprivateにしたい
  query = () => (
    this.#notion.databases.query({
      database_id: this.#DATABASE_ID,
    })
  )

  retrieve = ({ pageId }: { pageId: string }) => (
    this.#notion.pages.retrieve({
      page_id: pageId
    })
  )

  getPageIds = async () => {
    try {
      const response = await this.query()
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
   * @param today
   * @returns {Promise<boolean| undefined>} レコードとtodayが一致しているか
   */
  isToday = async (
    pageId: string,
    today: Dayjs
  ): Promise<boolean | undefined> => {
    try {
      const response = await this.retrieve({pageId});

      if (!(Props.DATE in response.properties)) {
        throw new Error("Date Prop Name is not found.");
      }

      const datePropName = response.properties[Props.DATE];

      if (!isDetectiveType<DatePropertyValue>(datePropName))
        throw new Error("Date Prop Name is not a Date.");
      if (datePropName.date !== null)
        return today.isSameAtDay(datePropName.date.start)
    } catch (error) {
      // if (error instanceof UnknownHTTPResponseError) {
      //   console.error({ error });
      // }
      console.error({ error });
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

  /**
   * ページの一覧を取得
   * @returns Page[]
   */
  queryPages = async (input: DatabasesQueryParameters): Promise<Page[]> => {
    try {
      const response = await this.#notion.databases.query({
        ...{ database_id: this.#DATABASE_ID },
        ...input,
        // sorts: [
        //   {
        //     property: Props.CLONE,
        //     direction: "ascending",
        //   },
        //   {
        //     property: Props.DATE,
        //     direction: "ascending",
        //   },
        // ],
      });
      return response.results;
    } catch (error) {
      if (error instanceof UnknownHTTPResponseError) {
        console.log(error.body);
      }
      throw error;
    }
  };
}
