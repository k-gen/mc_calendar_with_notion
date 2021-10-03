import dayjs from 'dayjs'
import { getWeekdays, getDiffContents } from '../utils/index.js'
import { queryPages } from './query_pages.js'
import { deleteClone, deletePages, updateContentOfName } from './update_pages.js'
import { createContent } from './create_pages.js'

/**
 * 初期化処理
 * @param today 
 * @returns 
 */
export const init = async (today: string) => {
    // ページオブジェクト一覧を取得
    let pages = await queryPages()
    // 当月の平日一覧を取得
    let weekdays = getWeekdays(dayjs(today).date(1))
    // 翌月の平日一覧を取得
    const weekdaysInNextMonth = getWeekdays(dayjs(today).date(1).add(1, 'month'))
    // 差分コンテンツの配列を初期化
    let diffContents: string[] = []
    // 月が替わる場合は重複ページ（名前）と複製ページを削除する
    if (dayjs(today).date() === 1) {
        await deletePages(pages)
        await deleteClone()
        console.log("Clone contents has deleted!");
        pages = await queryPages()
    }
    // 平日が人数より多い場合はページを複製してカレンダーを埋める
    if (weekdays.length >= pages.length) {
        // 翌月の第1営業日までカレンダーに含めるため差分数に1を加えておく
        const diff = weekdays.length - pages.length - diffContents.length + 1
        diffContents = [...diffContents, ...getDiffContents(pages, diff)]
        await createContent(diffContents)
        await updateContentOfName(diffContents)
        console.log(`${diffContents.length} items has created.`);
        // 追加分を含めたページ一覧を再取得
        pages = await queryPages()
    }
    // 配列に翌月の平日を追加
    weekdays = [...weekdays,...weekdaysInNextMonth]

    return {
        pages,
        weekdays
    }
}
