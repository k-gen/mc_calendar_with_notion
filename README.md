# MC Calendar with Notion

## これは何？

朝会の司会をメンバーの持ち回りでやるために、司会のスケジュール設定を自動化する目的で作成しました。

## 初期設定

Notionにintegrationを追加する手順については公式ドキュメントを参照してください

https://developers.notion.com/docs/getting-started

1. `.env.example`を参考に`.env`を作成してください。まずは`NOTION_KEY`の値にIntegration Tokenを設定します。
2. 次に`NOTION_DATABASE_ID`を設定します。APIで操作する対象のデータベースページのURLを確認します。`https://www.notion.so/{WORKSPACE_ID}/{NOTION_DATABASE_ID}?v=xxx`
3. すみません、ここからはNotionページ側での手作業です。データベースに次のカラムを追加してください。`Name(初期値)`, `Tags(初期値)`, `Date(追加)`。
4. `Tags`のtypeは`Select`に変更してください。`Date`のtypeは`Date`に設定してください。
5. 最後に、司会を担当する各メンバーの名前をレコードに追加して、`Tags`に`日直`ラベルをグレーで作成しましょう。

## アプリケーションの実行

`npm start`でアプリケーションを実行してください。正常に完了した際のイメージはこんな感じです。

![screenshot_mc_calendar](https://user-images.githubusercontent.com/46369030/132216300-fdc8146f-70c7-4848-8d69-e9534fa8a7db.png)
