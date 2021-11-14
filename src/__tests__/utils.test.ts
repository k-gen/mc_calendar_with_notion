import { makeConsoleLogger } from '@notionhq/client/build/src/logging';
import { notion } from '../config'
import { isTodayPage } from '../utils/page';
import * as mock from "./mock"
import { dayjsJa, matchWeekdays } from '../utils/index';

describe("utils.isToday", () => {
    let httpRequestGetMock: jest.SpyInstance;
    beforeEach(() => {
        httpRequestGetMock = jest.spyOn(notion.pages, "retrieve")
        httpRequestGetMock.mockResolvedValue(mock.today)
    })
    test("0", async () => {
        const result = await isTodayPage("b0b1467f-b5c1-40f2-8d9c-3576e8c28be5", dayjsJa("2021-09-30"))
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
        let adate = dayjsJa().add(1, 'month').date(1).formatY4M2D2()
        console.log({adate})
        expect(matchWeekdays(today, '月曜日', '土曜日')).toBe(true)

        console.log({ today: today.formatY4M2D2() })

        const start = today.startOf('month')
        console.log({ start: start.formatY4M2D2() })
        console.log('today === start', today === start)

        const date2021_11_01 = dayjsJa('2021-11-01')

        console.log(`date2021_11_01.isSame(date2021_11_01.startOf('month'), 'day')`, date2021_11_01.isSame(date2021_11_01.startOf('month'), 'day'))
        console.log(`date2021_11_01 === date2021_11_01.startOf('month')`, date2021_11_01 === date2021_11_01.startOf('month'))
    })
})
