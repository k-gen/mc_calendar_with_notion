import { notion, databaseId } from "../config/index.js";
import { DatePropertyValue, Page } from "@notionhq/client/build/src/api-types";
import { UnknownHTTPResponseError } from "@notionhq/client";
import { Dayjs } from "dayjs";
import { getWeekdaysByDate, isDetectiveType } from "../utils";

import { Config } from "../config.js";

const { DATABASE_ID } = Config.Notion;

/**
 * ページの一覧を取得
 * @returns Page[]
 */
export const queryPages = async (): Promise<Page[]> => {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID!,
      sorts: [
        {
          property: "Clone",
          direction: "ascending",
        },
        {
          property: "Date",
          direction: "ascending",
        },
      ],
    });
    return response.results;
  } catch (error) {
    if (error instanceof UnknownHTTPResponseError) {
      console.log(error.body);
    }
    throw error;
  }
};

/**
 * 複製されたページの一覧を取得
 * @returns Page[]
 */
export const queryClonePage = async (): Promise<Page[]> => {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID!,
      filter: {
        property: "Clone",
        checkbox: {
          equals: true,
        },
      },
    });
    return response.results;
  } catch (error) {
    if (error instanceof UnknownHTTPResponseError) {
      console.log(error.body);
    }
    throw error;
  }
};

/**
 * 今月の最初の営業日が割り当てられたページを取得
 * @param today
 * @returns Page[]
 */
export const queryPageFirstWeekdayInThisMonth = async (
  today: Dayjs
): Promise<Page[]> => {
  try {
    const firstWeekdayInThisMonth = getWeekdaysByDate(today)[0].formatY4M2D2();
    const response = await notion.databases.query({
      database_id: DATABASE_ID!,
      filter: {
        property: "Date",
        date: {
          equals: firstWeekdayInThisMonth,
        },
      },
    });
    return response.results;
  } catch (error) {
    if (error instanceof UnknownHTTPResponseError) {
      console.log(error.body);
    }
    throw error;
  }
};

/**
 * 次回の日直を取得
 * @param today
 * @returns 次回日直のページオブジェクト
 */
export const queryNextMC = async (today: Dayjs): Promise<Page> => {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID!,
      sorts: [
        {
          property: "Date",
          direction: "ascending",
        },
      ],
    });

    // 今日から直近の平日を日直として変数に代入
    return response.results.find((result) => (
      isDetectiveType<DatePropertyValue>(result.properties.Date)
        && today.diff(result.properties.Date.date?.start, 'day') < 0
    )) ?? response.results[0]
  } catch (error) {
    if (error instanceof UnknownHTTPResponseError) {
      console.log(error.body);
    }
    throw error;
  }
};
