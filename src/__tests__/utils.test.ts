import { makeConsoleLogger } from '@notionhq/client/build/src/logging';
import { notion } from '../config'
import { isToday } from '../utils/utils';
import * as mock from "./mock"
import { dayjsJa, matchWeekdays } from '../utils/index';

describe("utils.isToday", () => {
    let httpRequestGetMock: jest.SpyInstance;
    beforeEach(() => {
        httpRequestGetMock = jest.spyOn(notion.pages, "retrieve")
        httpRequestGetMock.mockResolvedValue(mock.today)
    })
    test("0", async () => {
        const result = await isToday("b0b1467f-b5c1-40f2-8d9c-3576e8c28be5", dayjsJa("2021-09-30"))
        expect(result).toBe(true)
    })
})

describe("utils.hasWeekday", () => {
    test('0', async () => {
        const today = dayjsJa()
        // const todayWeekDay = new Date().toLocaleString('en-us', {weekday:'long'}) as WeekDay
        // console.log({todayWeekDay})
        let date = dayjsJa().format('YYYY-MM-DD HH:mm:ss')
        console.log({date})
        let adate = dayjsJa().add(1, 'month').date(1).format('YYYY-MM-DD')
        console.log({adate})
        expect(matchWeekdays(today, '月曜日', '土曜日')).toBe(true)
    })
})
