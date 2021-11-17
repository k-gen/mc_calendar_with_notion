import { NotionRepository } from "../infrastructure/NotionRepository";
import { dayjsJa, getWeekdaysByDate } from "../utils";

export default class UpdateContentDate {
  constructor(private notionRepo: NotionRepository) {}

  /**
   * 翌週の日直当番の日付をレコードに追加
   * @returns {Promise<void>}
   */
  invoke = async (): Promise<void> => {
    // 各レコード行の id を取得
    const pageIds = await this.notionRepo.getPageIds();
    if (!pageIds || !pageIds.length) return;

    const today = dayjsJa();

    // 当月の平日のみのリストを取得
    let weekdays = getWeekdaysByDate(today).map(day => day.formatY4M2D2());

    // 当月の平日の数がレコード行数に満たない場合は来月分も取得
    if (pageIds.length > weekdays.length) {
      const weekdaysInNextMonth = getWeekdaysByDate(today.add(1, "month")).map(day => day.formatY4M2D2());
      weekdays = [...weekdays, ...weekdaysInNextMonth];
    }

    // 各レコード行に日付を追加
    const allResult = await Promise.all(
      pageIds.map(async (pageId, index) => {
        return await this.notionRepo.updatePageDate(pageId, weekdays[index]);
      })
    );
    console.dir({ allResult }, { depth: null });
  };
}
