---
aliases:
- 2020/09/20/blog-hosting-on-netlify.md
date: 2020-09-20 21:28:06 +0200
slug: blog-hosting-on-netlify
tags:
- blog
title: Blog を Netlify にホスティング
---
ブログのホスティング先を [GitHub Pages](https://pages.github.com/) から [Netlify](https://www.netlify.com/) に切り替えました。
評判が良い Netlify を実際に試して評価するため。

## Netlify を利用する利点

Netlify の公式サイトでも [GITHUB PAGES VS. NETLIFY](https://www.netlify.com/github-pages-vs-netlify/) という比較ページがありますが、
付け加えて二点。

GitHub Pages では現時点で [Jekyll](https://www.jekyllrb.com/) のバージョンは 3.9.0 に固定されており、
使用できるプラグインも限定されています。
一方 Netlify では各サイトのビルドを独立した環境で行うため、
このような制約がありません。

また Netlify ではデプロイ時のログを見ることができるため、
トラブルシューティングがしやすいです。

GitHub Pages はローカルに静的サイト構築フレームワークをインストールしなくても使えるため手軽ですが、
ある程度使い込むとなると Netlify の方が良いですね。

## Netlify の使い勝手

まだ GitHub Pages から移行して基本的な設定をした程度ですが、
Netlify は UI が直感的で迷うところがないです。

サイトをロールバックしたり、
プレビュー用のブランチを作成したり、
第三者からの pull request を受け付ける場合に自動的にプレビューを作成する機能などもあり、
プロダクション環境での運用でも便利そう。

もう少し使い込んでみる予定。

## 移行作業

### GitHub Pages から Netlify への移行

ローカルで Jekyll を実行できるようにしてある場合、
Netlify のセットアップは簡単です。

GitHub にあるリポジトリとブランチを選択し、
ホスト名などを設定するだけ。
Netlify の側で Jekyll を使ったサイトには標準で対応しているので、
自動的にビルドコマンドや公開するディレクトリなどが設定され、
手作業で修正を加える場所はほとんどありません。
大袈裟ではなく、
マウス数クリックで終了です。

カスタムドメインを使用している場合には、
追加でドメイン名の設定と、
DNS の CNAME を Netlify に向ける必要があります。

なお Jekyll を使っていて本番用（公開用）のサイトを構築している場合には、
Netlify のビルド設定で環境変数 `JEKYLL_ENV` を `production` に設定する必要があります。
さもないとテスト環境とみなされて、
ログ解析用のタグなどが出力されません。

**Setting - Build & Deploy - Environment**
![](/assets/2020/09/blog-hosting-on-netlify/netlify_jekyll_env.png)

### GitHub Pages のクリーンアップ

これまでは GitHub 上のリポジトリ isseis.github.io に push すると、
GitHub が自動的に変更をピックアップして対応する GitHub Pages を更新していましたが、
Netlify への移行に伴ってこれが不要になります。

GitHub リポジトリの設定で GitHub Pages の更新を止めようとしたところ、
うまくいかない。
調べたところ GitHub Community で解決策を見つけました。

[Can’t disable GitHub Pages for this repository](https://github.community/t/cant-disable-github-pages-for-this-repository/126156/4)
> GitHub Pages sites served from repositories that use the special naming scheme username.github.io can’t be unpublished as it’s expected that a Pages site will be served from these repos. In order to disable Pages for these repositories you’ll need to first rename it to something else.

リポジトリの名前を変更し、
Setting - GitHub Pages - Sources を None に変更して完了。