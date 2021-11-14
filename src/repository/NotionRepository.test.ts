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
    // jest.spyOn(Client.prototype, 'request').mockImplementation(() => Promise.resolve())

    // const querySpy = jest.fn(() => Promise.resolve(pages))
    // Object.assign(Client.prototype, 'databases', {
    //   value: { query: querySpy }
    // })

    // const querySpy = jest.spyOn(Client.prototype.databases, 'query').mockImplementation(() => Promise.resolve(pages)) // TODO これが動かない理由が不明

    // jest.mock('@notionhq/client/build/src/Client', () => ({
    //   databases: {
    //     query: () => Promise.resolve(pages)
    //   }
    // }))

    const notionRepositorySpy = new NotionRepository()
    const querySpy = jest.spyOn(notionRepositorySpy, 'query').mockImplementation(() => Promise.resolve(pages))

    await notionRepositorySpy.getPageIds()

    expect(querySpy).toHaveBeenCalled()
  })
  // const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  // expect(consoleErrorSpy).toHaveBeenCalled() // .toHaveBeenCalledTimes(1);
})
