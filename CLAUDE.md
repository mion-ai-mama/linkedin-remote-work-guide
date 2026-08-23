# LinkedIn海外在宅ワーク特典ページ

> 設計の共通原則（基本原則・資産価値の原則・自律解決の原則）は `~/.claude/CLAUDE.md` に従う。

## プロジェクト設定

技術スタック:
  frontend: HTML5 / CSS3 / Vanilla JavaScript（ビルド工程なし・フレームワーク不使用）
  backend: なし
  database: なし
  hosting: GitHub Pages（静的ファイル配信のみ）

このプロジェクトはビルド・サーバーが不要な完全な静的サイトです。
`index.html` をブラウザで直接開く、または `python3 -m http.server` 等の
簡易サーバーで確認できます。ポート番号のランダム生成・専用バックエンドポートの
割り当ては不要です。

本リポジトリは `mion-ai-mama/instagram-tokuten-template` を「Use this template」で
複製して作成した特典ページの実インスタンス（2件目）です。元のテンプレートリポジトリは
別に存在し、このリポジトリでの編集は元テンプレートに影響しません。

## 環境変数

このプロジェクトは環境変数を使用しません（APIキー・DB接続情報等が一切不要な
完全な静的サイトのため）。`.env` 系ファイルは作成しないでください。

## 命名規則

- ファイル: kebab-case（例: `video-poster.jpg`）
- JavaScript変数・関数: camelCase / 定数オブジェクト: `CONTENT`（大文字開始で固定）

## コンテンツの単一の源

ページの文章・プロンプト（PROMPT01〜06）・検索キーワード・チェックリスト項目・CTAリンク・
SEO/OGP情報は、すべて `js/content.js` の `CONTENT` オブジェクトが単一の真実の源。
`index.html` 内の文章はJavaScript無効時のフォールバック表示であり、`content.js` を
編集した際は可能であれば `index.html` 側も合わせて更新する（README.md参照）。

## ブラウザストレージ

STEP9のチェックリストの状態のみ `localStorage` に保存する（キー名は `js/script.js` 内で
一元管理）。保存する値は真偽値（チェックON/OFF）のみで、個人情報・入力テキストは
一切保存しない。

## コード品質

- 関数: 100行以下 / ファイル: 700行以下 / 複雑度: 10以下 / 行長: 120文字

## 開発ルール

### サーバー起動
- ローカル確認時は `python3 -m http.server <port>` 等の簡易サーバーを1つのみ起動
- 別ポートでの重複起動は避ける

### ドキュメント管理
許可されたドキュメントのみ作成可能:
- `docs/requirements.md`（要件定義）
- `docs/SCOPE_PROGRESS.md`（進捗管理）
- `README.md`（使い方・複製元テンプレートの説明）
- `LICENSE.md`（利用方針）
上記以外のドキュメント作成はユーザー許諾が必要。
