import { notion } from '../config'
import * as utils from "../utils"

const mockData = {
    page_id: '123456789',
    properties: {
        Date: {
            date: {
                start: "2021-09-30"
            }
        }
    }
}

describe("utils.isToday", () => {
    let httpRequestGetMock: jest.SpyInstance;
    beforeEach(() => {
        httpRequestGetMock = jest.spyOn(notion.pages, "retrieve")
        httpRequestGetMock.mockResolvedValue(mockData);
    })
    test("0", async () => {
        const result = await utils.isToday("123456789", "2021-09-30")
        expect(result).toBe(true)
    })
})
