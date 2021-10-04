import dayjs from 'dayjs'
import { getWeekdays, getDiffContents } from '../utils/index.js'
import { queryClonePage, queryPageByfirstWeekdayInThisMonth, queryPages } from './query_pages.js'
import { deleteCheckbox } from './delete_pages.js'
import { createClone } from './create_pages.js'
import { UnknownHTTPResponseError } from '@notionhq/client'
import { Page, TitlePropertyValue } from '@notionhq/client/build/src/api-types'
import { notion } from '../config/index.js'

/**
 * ページの並び替え
 * @param pages 
 * @param today 
 * @returns Page[]
 */
 const sortingPages = async (pages: Page[], today: string): Promise<Page[]> => {
    try {
        // 差分コンテンツの配列を初期化
        let diffContents: string[] = []
        // 削除対象のページ一覧を初期化
        let deletePages: Page[] = []        
        // 次に先頭になるページidを取得（当月の最初の営業日）
        const targetPageId = (await queryPageByfirstWeekdayInThisMonth(today))[0]?.id
        // 現在の先頭から次に先頭になるページまでを削除対象に追加
        if (targetPageId) {
            pages.some( page => {
                const id = page.id
                if (id === targetPageId) {
                    return true
                }
                deletePages.push(page)
            })
        }
        // 複製ページが存在する場合はカレンダーの先頭がずれた分の複製のチェックを外す
        const clonePages = await queryClonePage()
        // 削除対象のページを削除
        await Promise.all(
            deletePages.map( async deletePage => {
                return await notion.pages.update({
                    page_id: deletePage.id,
                    archived: true,
                    properties: {}
                })
            })
        )
        // 複製チェックを解除
        await deleteCheckbox()
        // 複製ページの数だけ削除対象リストから除外する
        if (clonePages.length) {
            diffContents = deletePages.slice(clonePages.length, deletePages.length).map(deletePage => {
                return (deletePage.properties.Name as TitlePropertyValue).title[0].plain_text
            })
        } else {
            diffContents = deletePages.map(deletePage => {
                return (deletePage.properties.Name as TitlePropertyValue).title[0].plain_text
            })
        }
        await createClone(diffContents)
        await deleteCheckbox()
        return await queryPages()
    } catch (error) {
        if (error instanceof UnknownHTTPResponseError) {
            console.log(error.body)
        }
        throw error
    }
}

/**
 * 初期化処理
 * @param today 
 * @returns pages
 * @returns weekdays
 */
export const init = async (today: string) => {
    // ページオブジェクト一覧を取得
    let pages = await queryPages()
    // 当月の平日一覧を取得
    let weekdays = getWeekdays(dayjs(today).date(1))
    // 翌月の平日一覧を取得
    const weekdaysInNextMonth = getWeekdays(dayjs(today).date(1).add(1, 'month'))
    // カレンダー更新処理
    if (dayjs(today).date() === 1) {
        // ページの並び替え
        pages = await sortingPages(pages, today)
        // ページ数が平日数に満たない場合は先頭からメンバーを複製
        if (weekdays.length >= pages.length) {
            // 翌月の第1営業日までカレンダーに含めるため差分数に1を加えておく
            const diff = (weekdays.length + 1) - pages.length
            pages = await createClone([...getDiffContents(pages, diff)])
        }
    }
    // 配列に翌月の平日を追加
    weekdays = [...weekdays,...weekdaysInNextMonth]

    return {
        pages,
        weekdays
    }
}
