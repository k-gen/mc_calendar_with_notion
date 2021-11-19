import { Dayjs } from "dayjs";
import { NotionRepository } from "../infrastructure/NotionRepository";

export default class UpdateContentTag {
  constructor(private notionRepo: NotionRepository) {}
  /**
   * 当日が日直のメンバーにタグを追加する
   * @param today
   * @returns {void}
   */
  invoke = async (today: Dayjs) => {
    const pageIds = await this.notionRepo.getPageIds();
    if (pageIds == null || pageIds.length === 0) return;

    const allResult = await Promise.all(
      pageIds.map(async pageId => {
        if (await this.notionRepo.isToday(pageId, today)) {
          return await this.notionRepo.updatePageTag(pageId, true);
        } else {
          return await this.notionRepo.updatePageTag(pageId, false);
        }
      })
    );
    console.dir({ allResult }, { depth: null });
  };
}
