import { Page, TitlePropertyValue } from "@notionhq/client/build/src/api-types";

/**
 * 差分コンテンツの取得
 * @param pages - ページオブジェクトの一覧
 * @param diff - 当月の平日数と行数(人数)の差
 * @returns 差分コンテンツのタイトルのリスト
 */
export const getDiffContents = (pages: Page[], diff: number): string[] => {
  return pages.slice(0, diff).map(page => {
    return (page.properties.Name as TitlePropertyValue).title[0].plain_text;
  });
};
