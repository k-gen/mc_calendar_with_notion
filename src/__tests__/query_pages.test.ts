import { notion } from '../config'
import { queryPages } from "../modules/queryPages"
import { getDiffContents } from '../utils';
import * as mock from "./mock"

describe("query_pages.queryDiffContents", () => {
    let httpRequestGetMock: jest.SpyInstance;
    beforeEach(() => {
        httpRequestGetMock = jest.spyOn(notion.databases, "query")
        httpRequestGetMock
            .mockResolvedValue(mock.pages)
            .mockResolvedValueOnce(mock.pages)
            .mockResolvedValueOnce({results: []});
    })
    // test("0", async () => {
    //     await query_pages.queryDiffContents([], Infinity)
    // })
    test("1", async () => {
        let pages = await queryPages()
        const result = await getDiffContents(pages, 3)
        expect(pages).toEqual(mock.pages.results)
        expect(result.length).toBe(3)
        expect(result).toStrictEqual(["ももこ","ののか","ようこ"])
    })
})

// describe("query_pages.queryDeletePages", () => {
//     let httpRequestGetMock: jest.SpyInstance;
//     beforeEach(() => {
//         httpRequestGetMock = jest.spyOn(notion.databases, "query")
//         httpRequestGetMock.mockResolvedValue(mock.pages)
//     })
//     test("0", async () => {
//         await query_pages.queryDeletePages([])
//     })
//     test("1", async () => {
//         let pages = await query_pages.queryPages()
//         await query_pages.queryDeletePages(pages)
//     })
// })
