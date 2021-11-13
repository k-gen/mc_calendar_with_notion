import { dayjsJa } from './utils/index.js';
import { updateContentOfDate, updateContentOfNextTimeTags, updateContentOfTodayTags } from './modules/update_pages.js'
import { init } from './modules/init_pages.js'

export function update (_, res) {
    (async () => {
        const today = dayjsJa()
        const {pages, weekdays} = await init(today)
        await updateContentOfDate(pages, weekdays)
        console.log("Success! Updated date.")
        await updateContentOfTodayTags(pages, today)
        console.log("Success! Updated tags.")
        await updateContentOfNextTimeTags(today)
        console.log("Success! Updated next MC.")
        res.send('finish');
    })()
};
