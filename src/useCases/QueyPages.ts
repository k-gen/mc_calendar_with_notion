import { DatabasesQueryParameters } from "@notionhq/client/build/src/api-endpoints";
import { Page } from "@notionhq/client/build/src/api-types";
import { Config } from "../config";
import { NotionRepository } from "../repository/NotionRepository";

export default class QueryAllPages {
  constructor(private notionRepo: NotionRepository) {}

  invoke = async (): Promise<Page[]> => {
    const input = {
      sorts: [
        {
          property: Config.Notion.Props.CLONE,
          direction: "ascending",
        },
        {
          property: Config.Notion.Props.DATE,
          direction: "ascending",
        },
      ]
    } as DatabasesQueryParameters
    const pages = this.notionRepo.queryPages(input)
    console.dir({ pages }, { depth: null });
    return pages
  };
}
