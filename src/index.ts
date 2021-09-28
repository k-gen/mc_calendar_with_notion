import dayjs from 'dayjs';
import 'dayjs/locale/ja.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from "dayjs/plugin/utc.js";
import weekday from 'dayjs/plugin/weekday.js'
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(weekday)
import { updateContentOfDate, updateContentOfNextTimeTags, updateContentOfTodayTags } from './modules/update_pages.js'
import { init } from './modules/init_pages.js'

export function update (req, res) {
    (async () => {
        const today = dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD')
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
