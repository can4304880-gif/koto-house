# Googleフォーム作成メモ

`contact.html` には、Googleフォームの埋め込み枠を `YOUR_GOOGLE_FORM_EMBED_URL` のプレースホルダー付きで実装しています。

## 手動作業

1. [Google フォーム](https://forms.google.com) で新規フォームを作成する
2. 以下の6項目を追加する
   - お名前（必須）
   - メールアドレス（必須）
   - ご住所
   - お電話番号
   - ご使用の目的
   - お問い合わせ内容
3. フォーム右上の「送信」から「<>（埋め込み）」タブを開き、iframeコードを取得する
4. iframeコード内の `src` URL を控え、以下の変数として扱う

```text
GOOGLE_FORM_EMBED_URL=YOUR_GOOGLE_FORM_EMBED_URL
```

## 差し替え箇所

`contact.html` の以下を、取得したGoogleフォームの埋め込みURLに差し替えてください。

```html
src="YOUR_GOOGLE_FORM_EMBED_URL"
```

Googleフォームの入力画面自体はiframe内に表示されるため、フォーム内部の白背景や細かな見た目はサイト側のCSSでは変更できません。外側のラッパーで、KOTO HOUSEのダークトーンに馴染むよう調整しています。
