---
title: "コメント投稿システム"
date: 2020-12-09T21:20:41+01:00
order: 3
---
## getform

[getform](https://getform.io/) をバックエンドに使用。

1. コンソールから新規フォームを作成
2. endpoint が取得できるので、それを埋め込んだ form を作る。

* [公式ドキュメント](https://app.getform.io/docs)

## reCAPTCHA v3

getform の認証に使用。
必要な変更内容は Git リポジトリの [commit](https://github.com/isseis/blog-hugo/commit/ac50a42d9a99ae4f6712f60168d01362de893680) を参照。

* [公式ドキュメント](https://developers.google.com/recaptcha/docs/v3)
* [admin console](https://www.google.com/recaptcha/admin/site/432680470)
