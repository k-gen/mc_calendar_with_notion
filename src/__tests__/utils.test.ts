import { notion } from '../config'
import * as utils from "../utils"
import * as mock from "./mock"

describe("utils.isToday", () => {
    let httpRequestGetMock: jest.SpyInstance;
    beforeEach(() => {
        httpRequestGetMock = jest.spyOn(notion.pages, "retrieve")
        httpRequestGetMock.mockResolvedValue(mock.today)
    })
    test("0", async () => {
        const result = await utils.isToday("b0b1467f-b5c1-40f2-8d9c-3576e8c28be5", "2021-09-30")
        expect(result).toBe(true)
    })
})
