import { DatePropertyValue, TitlePropertyValue } from '@notionhq/client/build/src/api-types';
import dayjs from 'dayjs';
import * as init_pages from "../modules/init_pages";
import { queryPages } from '../modules/query_pages';
import { updateContentOfDate, updateContentOfTodayTags, updateContentOfNextTimeTags } from '../modules/update_pages';

describe("update test", () => {
    const update = async (today) => {
        const {pages, weekdays} = await init_pages.init(today)
        await updateContentOfDate(pages, weekdays)
        console.log("Success! Updated date.")
        await updateContentOfTodayTags(pages, today)
        console.log("Success! Updated tags.")
        await updateContentOfNextTimeTags(today)
        console.log("Success! Updated next MC.")
        return await queryPages()
    }
    test("2021-09-01", async () => {
        const today = dayjs('2021-09-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2021-10-01", async () => {
        const today = dayjs('2021-10-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2021-11-01", async () => {
        const today = dayjs('2021-11-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2021-12-01", async () => {
        const today = dayjs('2021-12-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(3)
    })
    test("2022-01-01", async () => {
        const today = dayjs('2022-01-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2022-02-01", async () => {
        const today = dayjs('2022-02-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2022-03-01", async () => {
        const today = dayjs('2022-03-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2022-04-01", async () => {
        const today = dayjs('2022-04-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(2)
    })
    test("2022-05-01", async () => {
        const today = dayjs('2022-05-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2022-06-01", async () => {
        const today = dayjs('2022-06-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2022-07-01", async () => {
        const today = dayjs('2022-07-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2022-08-01", async () => {
        const today = dayjs('2022-08-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
    test("2022-09-01", async () => {
        const today = dayjs('2022-09-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(3)
    })
    test("2022-10-01", async () => {
        const today = dayjs('2022-10-01').format('YYYY-MM-DD')
        const pages = await update(today)
        expect(dayjs((pages.slice(-1)[0].properties.Date as DatePropertyValue).date?.start).date()).toBe(1)
    })
})
