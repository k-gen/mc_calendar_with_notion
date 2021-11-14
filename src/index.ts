import { dayjsJa } from './utils';
import UpdateContent from "./controller/UpdateContent";
import { NotionRepository } from "./repository/NotionRepository";
import {
    updateContentOfDate,
    updateContentOfNextTimeTags,
    updateContentOfTodayTags,
} from "./modules/updatePages";
import { init } from "./modules/initPages";

export function update(_, res) {
  (async () => {
    const today = dayjsJa()
    const { pages, weekdays } = await init(today);
    await updateContentOfDate(pages, weekdays);
    console.log("Success! Updated date.");
    await updateContentOfTodayTags(pages, today);
    console.log("Success! Updated tags.");
    await updateContentOfNextTimeTags(today);
    console.log("Success! Updated next MC.");
    res.send("finish");
    // TODO: impl
    await new UpdateContent(new NotionRepository()).invoke();
  })();
}
