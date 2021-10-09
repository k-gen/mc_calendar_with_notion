import dayjs from 'dayjs'
import { getWeekdays, getDiffContents } from '../utils/index.js'
import { queryClonePage, queryPageByfirstWeekdayInThisMonth, queryPages } from './query_pages.js'
import { deleteClone } from './delete_pages.js'
import { createClone } from './create_pages.js'
import { UnknownHTTPResponseError } from '@notionhq/client'
import { Page } from '@notionhq/client/build/src/api-types'
import { updateContentOfName } from './update_pages.js'

/**
 * ページの並び替え
 * @param pages 
 * @param today 
 * @returns Page[]
 */
 const sortPages = async (pages: Page[], today: string): Promise<Page[]> => {
    try {
        let sortPages: Page[] = []        
        // 次に先頭になるページのpage_idを取得（今月の第1営業日）
        const startPageId = (await queryPageByfirstWeekdayInThisMonth(today))[0]?.id
        // 次に先頭になるページの直前までを配列に追加
        if (startPageId) {
            pages.some( page => {
                if (page.id === startPageId) return true
                sortPages.push(page)
            })
        }
        const startPages = pages.slice(sortPages.length, pages.length)
        const clonePages = await queryClonePage()
        if (clonePages.length) {
            const sortPagesWithExcludedClonePages = sortPages.slice(clonePages.length, sortPages.length)
            sortPages = [...startPages, ...sortPagesWithExcludedClonePages]
            await deleteClone(clonePages)
            pages = await queryPages()
        } else {
            sortPages = [...startPages, ...sortPages]
        }
        await updateContentOfName(pages, sortPages)
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
        pages = await sortPages(pages, today)
        // ページ数が平日数に満たない場合は先頭から順にページを複製
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
