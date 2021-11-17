import { NotionRepository } from "../infrastructure/NotionRepository";
import UpdateContentDate from "../useCases/UpdateContentDate";
import UpdateContentTag from "../useCases/UpdateContentTag";
import { dayjsJa } from "../utils";

export default class UpdateContent {
  constructor(private notionRepo: NotionRepository) {}
  invoke = async () => {
    await new UpdateContentDate(this.notionRepo).invoke();
    await new UpdateContentTag(this.notionRepo).invoke(
      dayjsJa()
    );
  };
}
