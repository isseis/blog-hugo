---
title: "ポスト作成＆プレビュー環境の構築"
date: 2020-12-08T08:11:47+01:00
order: 1
---
## blog 環境構築

### git レポジトリ取得

```sh
git clone git@github.com:isseis/blog-hugo.git
git submodule init
git submodule update

cd blog-hugo
git config pull.ff only
git config user.mail  4515431+isseis@users.noreply.github.com
```

### hugo インストール

パッケージ
https://github.com/gohugoio/hugo/releases

```sh
sudo dpkg -i hugo_0.79.0_Linux-64bit.deb
```
