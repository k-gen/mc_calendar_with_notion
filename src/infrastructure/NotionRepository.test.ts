import Client from "@notionhq/client/build/src/Client";
import { pages } from "../__tests__/mock";
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

  test('call:getPages', async () => {
    const notionRepositorySpy = new NotionRepository()
    const querySpy = jest.spyOn(notionRepositorySpy, 'query').mockImplementation(() => Promise.resolve(pages))

    const result = await notionRepositorySpy.getPageIds()
    if (!result) {
      throw new Error('The results property of the page mock is empty');
    }

    expect(querySpy).toHaveBeenCalled()
    expect(result).toEqual(pages.results.map(result => result.id))
  })

  test('', async () => {

  })
})
