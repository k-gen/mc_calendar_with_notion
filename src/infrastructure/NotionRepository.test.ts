import { DatabasesQueryResponse, PagesRetrieveResponse } from "@notionhq/client/build/src/api-endpoints";
import Client from "@notionhq/client/build/src/Client";
import { dayjsJa } from "../utils";
import { page, pages } from "../__tests__/mock";
import { NotionRepository } from "./NotionRepository";

describe('NotionRepository', () => {
  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
  });
  afterAll(() => {
    jest.restoreAllMocks();
  })

  test('NOTION_DATABASE_ID_is_empty', () => {
    expect(() => {new NotionRepository({ _KEY: '' })}).toThrowError('Notion config is not set') // .toHaveBeenCalledTimes(1);
  })

  describe('getPages()', () => {
    test('getPages(): success', async () => {
      const notionRepository = new NotionRepository()
      const querySpy = jest.spyOn(notionRepository, 'query').mockImplementation((): Promise<DatabasesQueryResponse> => Promise.resolve(pages as DatabasesQueryResponse))

      const result = await notionRepository.getPageIds()
      if (!result) {
        throw new Error('The results property of the page mock is empty');
      }

      expect(querySpy).toHaveBeenCalled()
      expect(result).toEqual(pages.results.map(result => result.id))
    })
  })

  describe('isToday()', () => {
    test('isToday(): failed: DateProperty is undefined', async () => {
      const notionRepository = new NotionRepository()
      const retrieveSpy = jest.spyOn(notionRepository, 'retrieve').mockImplementation((_: { pageId: string }): Promise<PagesRetrieveResponse> => {
        delete page.properties.Date
        return Promise.resolve({
          ...page,
          properties: {
            ...page.properties,
          }
        } as unknown as PagesRetrieveResponse)
      })
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

      await notionRepository.isToday('', dayjsJa())
      expect(retrieveSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
