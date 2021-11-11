import dayjs from "dayjs";
import { NotionRepository } from "../repository/NotionRepository";
import UpdateContentDate from "../useCases/UpdateContentDate";
import UpdateContentTag from "../useCases/UpdateContentTag";

export default class UpdateContent {
  constructor(private notionRepo: NotionRepository) {}
  invoke = async () => {
    await new UpdateContentDate(this.notionRepo).invoke();
    await new UpdateContentTag(this.notionRepo).invoke(
      dayjs().format("YYYY-MM-DD")
    );
  };
}
