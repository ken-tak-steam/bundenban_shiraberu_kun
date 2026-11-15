# 分電盤しらべる君

停電の範囲、分電盤、家電のイラストを見て、必要な操作を順番に選ぶ授業用ゲームです。停電点検ゲームのタイプB最新版を引き継いでいます。

## 使い方

`index.html` をブラウザで開きます。ビルド・インストール・ログインは不要です。

1. 問題文と図を見て、必要な操作をする順にタップします。
2. もう一度タップすると、その選択を取り消せます。
3. 「決定」で答え合わせ。不正解なら選び直せます。
4. 正解の説明を閉じると、自動で次のステージへ進みます。

全5ステージ：テレビだけつかない／家全体の使いすぎ／台所回路の使いすぎ／漏電遮断器／近所を含む停電。それぞれに不要な操作を含みます。

ノーヒント正解は2点、ヒント使用後は1点、合計10点満点です。同じ問題をやり直してもヒント使用は取り消されません。得点・進行は保存しないため、再読み込みすると最初からになります。

## 配布形式と通信

- `index.html` はCSS・JavaScript・SVGのイラスト・ライセンス全文を内蔵した単体HTMLです。
- アプリ内の「HTMLを保存」、または `download.html` の確認ボタンから保存できます。
- 保存したHTMLはオフラインで利用できます。ゲームの回答・得点を外部送信する処理やCDN依存はありません。
- Web版の取得、ダウンロード、参考サイトのリンクを開く際には通信が発生します。
- ダウンロード版でも「ライセンス・免責事項」を確認できます。

## GitHub Pages

リポジトリ：<https://github.com/ken-tak-steam/bundenban_shiraberu_kun>

公開後の予定URL：

- アプリ：<https://ken-tak-steam.github.io/bundenban_shiraberu_kun/>
- ダウンロード：<https://ken-tak-steam.github.io/bundenban_shiraberu_kun/download.html>

Settings → Pages → Deploy from a branch → `main` / `(root)` で公開する形式です。リポジトリの公開範囲やGitHubのプランによって利用可否が異なります。URLの記載だけでは公開完了を意味しません。

## 利用条件

© 2026 Takakura Kentaro。著作権は放棄しません。

従来アプリと同じく、非商用の使用・複製・改変・再配布、および学校教育、有料・無料の講習会・研修会での教材利用を認めます。再配布時は作者名・出典URL・ライセンスを明示してください。詳しくは [LICENSE](LICENSE) と [免責事項](DISCLAIMER.md) をご確認ください。

実設備の点検・復旧を保証するものではありません。生徒だけで実物を操作しないでください。

## 記事・サムネイル

- `docs/note-article.md`：note投稿用の原稿
- `docs/note-thumbnail.png`：記事の見出し画像
- `docs/provenance.md`：引き継いだソースと変更点

## 検証

`tests/game.cjs` はPlaywrightとChromiumを使い、全5問の正誤・順序・ヒント・得点・自動進行・再挑戦、ダウンロードとオフライン利用、画面幅を検証します。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
# 別ターミナルで（Playwrightが必要）
node tests/game.cjs
```

参考：[九州電力送配電「電気がつかないときは」](https://www.kyuden.co.jp/td/emergency/teiden/guide.html)
