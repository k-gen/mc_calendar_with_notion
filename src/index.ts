import "dayjs/locale/ja.js";
import UpdateContent from "./controller/UpdateContent";
import { NotionRepository } from "./repository/NotionRepository";

(async () => {
  await new UpdateContent(new NotionRepository()).invoke();
})();
