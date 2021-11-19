import { NotionRepository } from "../repository/NotionRepository";
import QueryAllPages from "../useCases/QueyPages";

export default class UpdateContent {
  constructor(private notionRepo: NotionRepository) {}
  invoke = async () => {
    await new QueryAllPages(this.notionRepo).invoke();
  };
}
