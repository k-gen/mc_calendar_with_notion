import { init } from "../modules/init_pages";
// import { updateContentOfDate, updateContentOfTodayTags, updateContentOfNextTimeTags } from '../modules/update_pages';
import { dayjsJa } from "../utils";

describe("update test", () => {
    const update = async (today) => {
        // FIXME
        const {pages, weekdays} = await init(today)
        // await updateContentOfDate(pages, weekdays)
        console.log("Success! Updated date.")
        // await updateContentOfTodayTags(pages, today)
        console.log("Success! Updated tags.")
        // await updateContentOfNextTimeTags(today)
        console.log("Success! Updated next MC.")
    }
    test("2021-09-01", async () => {
        const today = dayjsJa('2021-09-01')
        await update(today)
    })
    test("2021-10-01", async () => {
        const today = dayjsJa('2021-10-01')
        await update(today)
    })
    test("2021-11-01", async () => {
        const today = dayjsJa('2021-11-01')
        await update(today)
    })
    test("2021-12-01", async () => {
        const today = dayjsJa('2021-12-01')
        await update(today)
    })
    test("2022-01-01", async () => {
        const today = dayjsJa('2022-01-01')
        await update(today)
    })
    test("2022-02-01", async () => {
        const today = dayjsJa('2022-02-01')
        await update(today)
    })
    test("2022-03-01", async () => {
        const today = dayjsJa('2022-03-01')
        await update(today)
    })
    test("2022-04-01", async () => {
        const today = dayjsJa('2022-04-01')
        await update(today)
    })
    test("2022-05-01", async () => {
        const today = dayjsJa('2022-05-01')
        await update(today)
    })
    test("2022-06-01", async () => {
        const today = dayjsJa('2022-06-01')
        await update(today)
    })
    test("2022-07-01", async () => {
        const today = dayjsJa('2022-07-01')
        await update(today)
    })
    test("2022-08-01", async () => {
        const today = dayjsJa('2022-08-01')
        await update(today)
    })
    test("2022-09-01", async () => {
        const today = dayjsJa('2022-09-01')
        await update(today)
    })
    test("2022-10-01", async () => {
        const today = dayjsJa('2022-10-01')
        await update(today)
    })
})
