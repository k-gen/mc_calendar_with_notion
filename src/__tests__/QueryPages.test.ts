import { NotionRepository } from "../repository/NotionRepository";
import QueryAllPages from "../useCases/QueyPages";

describe("QueryPages", () => {
    test("1", async () => {
        let pages = await new QueryAllPages(new NotionRepository).invoke()
        console.log(pages.length)
        expect(pages).toBeTruthy
    })
})