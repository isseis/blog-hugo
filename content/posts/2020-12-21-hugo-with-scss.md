---
title: "Blog のスタイルシートを Scss に"
date: 2020-12-21T14:59:07+01:00
slug: "hugo-with-scss"
tags:
- blog
---
この blog は [Hugo](https://gohugo.io/) を使って生成していますが、
見た目を指定するのに使う CSS ファイルを直接手書きするのではなく、
Scss で書いて CSS ファイルを自動生成するようにしました。

## 背景

CSS ファイルはテキストエディタを使って直接書くこともできますが、
記法に制限が多く煩雑になりがちです。
そこで今は

* [Sass (Syntactically awesome style sheets)](https://sass-lang.com/) でスタイルを記述し、
    それからプログラムで CSS に変換して使うのが一般的
* Sass がサポートする記法には Sass 記法、Scss 記法のふたつがあり、
    後者は CSS の上位互換となっているため移行が容易。

という話は知ってはいたものの、
実は使ったことがありませんでした。

## Hugo の Scss 対応

Sass から CSS を作成するツールはいくつかありますが、
Hugo には [Sass/Scss パイプライン](https://gohugo.io/hugo-pipes/scss-sass/) が組み込まれた extended バージョンが存在するため、
それを使うことにしました。

1. ローカルの Linux on Chromebook 環境には [Install Hugo](https://gohugo.io/getting-started/installing/) の手順に従ってソースコードからインストール。
2. 次に既存の CSS ファイルを `/static/css` から `/assets/sass` ディレクトに移動し、
ファイル名の末尾を `.css` から `.scss` に変更。
3. 合わせて、レイアウトファイルで CSS をリンクしている部分を書き換えます。<br>
    変更前
    ```html
    <link rel="stylesheet" href="/css/getform.css">
    ```
    変更後
    ```html
    {{ $style := resources.Get "sass/getform.scss" | toCSS | minify | fingerprint }}
    <link rel="stylesheet" href="{{ $style.Permalink }}">
    ```

最初の `resources.Get` は Hugo パイプラインにファイルからの読み込みを指示しており、
デフォルトでは `/assets` ディレクトリからの相対パスで指定します
（参考: [Hugo Pipes Introduction: From file to resourc](https://gohugo.io/hugo-pipes/introduction/#from-file-to-resource)）。

ファイルを読み込んで生成したリソースに対して、
[Resource.ToCSS](https://gohugo.io/hugo-pipes/scss-sass/) を適用して SCSS から CSS に変更、
[Resource.Minify](https://gohugo.io/hugo-pipes/minification/) でプログラム的には意味がない改行や空白文字を除去して軽量化、
最後に [Resource.Fingerprint](https://gohugo.io/hugo-pipes/fingerprint/) でファイル名にフィンガープリントをつけ、
内容が変わった際に誤って古いキャッシュを参照し続けることがないようにします。

メソッド名は正式には Resource + 大文字開始ですが [Method aliases](https://gohugo.io/hugo-pipes/introduction/#method-aliases) が定義されているので、
先頭の `Resource.` をとった小文字始まりの名前が使えます。

### 次の一歩

複数の CSS ファイルを参照していた場合、
Scss の @import を使って一つにまとめることで、
ソースコードレベルでは分割して扱いやすくしつつ、
HTML ファイルからは単一の CSS ファイルにリンクするように変更できます。

また Scss は CSS 上位互換なのでそのままでも使えますが、
入れ子になった部分や共通部分をくくりだして、
同じ内容を簡略化して書き直すことができます。

## Travis CI の Scss 対応

このブログは GitHub に変更点を push すると、
Travis CI がそれを検出して自動的にサイトを再構築します。

サイト再構築の際、
Travis CI 上の Linux インスタンスは [Snap Store](https://docs.travis-ci.com/user/deployment/snaps/) から Hugo をインストールしますが、
ここで Sass/Scss パイプラインが組み込まれた extended バージョンの Hugo を使うように、
設定ファイル `.travis.yml` の Hugo パッケージのところに `channel: extended` を指定します。

**.travis.yml**
```yml
addons:
  snaps:
  - name: hugo
    channel: extended
```

## TODO

[Sass のドキュメント](https://sass-lang.com/documentation) に一通り目を通す。
