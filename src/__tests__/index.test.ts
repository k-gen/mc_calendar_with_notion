import dayjs from 'dayjs';
import { init } from "../modules/initPages";
import { updateContentOfDate, updateContentOfTodayTags, updateContentOfNextTimeTags } from '../modules/updatePages';

describe("update test", () => {
    const update = async (today) => {
        const {pages, weekdays} = await init(today)
        await updateContentOfDate(pages, weekdays)
        console.log("Success! Updated date.")
        await updateContentOfTodayTags(pages, today)
        console.log("Success! Updated tags.")
        await updateContentOfNextTimeTags(today)
        console.log("Success! Updated next MC.")
    }
    test("2021-09-01", async () => {
        const today = dayjs('2021-09-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2021-10-01", async () => {
        const today = dayjs('2021-10-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2021-11-01", async () => {
        const today = dayjs('2021-11-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2021-12-01", async () => {
        const today = dayjs('2021-12-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-01-01", async () => {
        const today = dayjs('2022-01-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-02-01", async () => {
        const today = dayjs('2022-02-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-03-01", async () => {
        const today = dayjs('2022-03-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-04-01", async () => {
        const today = dayjs('2022-04-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-05-01", async () => {
        const today = dayjs('2022-05-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-06-01", async () => {
        const today = dayjs('2022-06-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-07-01", async () => {
        const today = dayjs('2022-07-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-08-01", async () => {
        const today = dayjs('2022-08-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-09-01", async () => {
        const today = dayjs('2022-09-01').format('YYYY-MM-DD')
        await update(today)
    })
    test("2022-10-01", async () => {
        const today = dayjs('2022-10-01').format('YYYY-MM-DD')
        await update(today)
    })
})
