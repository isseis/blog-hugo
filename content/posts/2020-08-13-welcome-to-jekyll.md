---
title:  ブロク作成環境を Jekyll に変更
date:   2020-08-13 00:16:00 +0200
tags:	[blog]
slug:   "welcome-to-jekyll"
aliases:
    - /2020/08/13/welcome-to-jekyll.html
---
これまで Web で公開したい文書は [Blogger] で書いていましたが、
マークダウン記法が使える [Jekyll] と [GitHub Pages] に移行することにしました。

追記: 後日さらに [Hugo](https://gohugo.io) に移行し、
このエントリも Hugo で出力されています。

## 背景

Blogger は入力画面で見えるものが最終結果に近く書式設定もメニューから操作できるため分かりやすいですが、
一方で編集機能が弱いです。
そこで Google Docs などで下書きした文書をコピーしてくると、
今度は大量の書式指定が入った HTML になってしまい修正に手間がかかります。

### Blogger の例

#### 入力
![blogger HTMLコード](/assets/2020/08/13/blogger_garbage_tags.png)

#### 出力
![blogger Web表示イメージ](/assets/2020/08/13/blogger_screenshot.png)

### マークダウンの例

[Jekyll] はマークダウン記法で記事を書くと HTML に変換し、
同時に記事一覧などのページを作成するツールです。
凝ったデザインのページを作るには向きませんが、
構造化されたテキストを気楽に書けます。


#### 入力

```
| | 所要日数 | 保障額 |
|-|-|-|
| 国際通常郵便（手紙・船便） | 1~3ヶ月 | なし |
| 国際通常郵便（手紙・SAL便） | 14日間 | 6000円 |
```

#### 出力

| | 所要日数 | 保障額 |
|-|-|-|
| 国際通常郵便（手紙・船便） | 1~3ヶ月 | なし |
| 国際通常郵便（手紙・SAL便） | 14日間 | 6000円 |

## 環境構築

マークダウン記法で書いたテキストファイルを [GitHub Pages] にアップロードするだけでも公開できますが、私は

1. 自分の PC で記事を作成
1. 手元の環境で記事を HTML にして、意図通りに見えるか確認
1. [GitHub Pages] にアップロードして公開

という手順にしたかったので、
手元の PC に [Jekyll] をインストールしてマークダウン記法のファイルから HTML を作れるようにしてみました。

使っている PC は Google Pixelbook (2017) で、
スペックは次の通りです。

| OS | CPU | RAM |
| - | - | - |
| ChromeOS | COre i7 (7th Gen) | 16GB |

[Jekyll] は ChromeOS では動きませんが、
Pixelbook 上に [Linux（ベータ版）をセットアップ](https://support.google.com/chromebook/answer/9145439) できるので、
その Linux 環境上に [Jekyll] をセットアップしました。

### Ruby 2.7.1 のインストール

[Jekyll] を使うには Ruby バージョン 2.5.0 以上が必要です。

Pixelbook は標準で APT パッケージマネージャーを使えるので、
これで Ruby をインストールしようと思ったのですが、

```
$ apt-cache showpkg ruby
Package: ruby
Versions:
1:2.3.3 (/var/lib/apt/lists/deb.debian.org_debian_dists_stretch_main_binary-amd64_Packages)
```

残念ながら Ruby のバージョンが古いので使えません。

調べたところ、rbenv を使うと任意のバージョンの Ruby をインストールでき、
バージョンの変更も容易とのこと。
[Basic GitHub Checkout](https://github.com/rbenv/rbenv#basic-github-checkout) の手順に従い `~/.rbenv` 以下にファイルを展開し、
この時点で安定版として最新の 2.7.1 をインストールしました。

```
% rbenv install 2.7.1
```

Ruby のソースコードを持ってきてビルドするので、
時間がかかります。
何度か Ruby 2.7.1 が依存するパッケージが不足しているということでビルドに失敗したので、
その都度パッケージを `apt-get` コマンドでインストールして、最終的に Ruby のインストールに成功。

```
$ ruby -v
ruby 2.7.1p83 (2020-03-31 revision a0c7c23c9c) [x86_64-linux]
```

### Jekyll のインストール

[GitHub Pages] の説明に従って GitHub Pages 用の Git リポジトリを作成し、
手元に clone してきます。
私は GitHub リポジトリへのアクセスに ssh を使っていますが、
HTTPS を使っている場合には URL が変わります。

```
% git clone git@github.com:$(GIT_USER)/$(GIT_USER).github.io
```

手元に `$(GIT_USER).github.io` というディレクトリができるので、
そこに移動して jekyll をセットアップします。

```
% cd $(GIT_USER).github.io
% bundle init
% bundle add github-pages
% bundle exec jekyll new . --force
```

警告が出ますが Gemfiles が更新されていれば無視して大丈夫です。
こうして作成された Gemfiles をエディタで開いて、
下記のコメントに従って変更します。

```
# If you want to use GitHub Pages, remove the "gem "jekyll"" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins
```

最後に Gemfiles の変更を反映して終了です。

```
% bundle update github-pages
```

### Jekyll の起動とテスト

```
% bundle exec jekyll s
```

これで [Jekyll] が起動して、
各種設定ファイルや `_post` ディレクトリ以下にある記事を処理して Web サイトを作成します。
[Jekyll] は HTML ファイル作成後も終了せず、
そのまま実行を続けます。

* ファイルの変更を監視し、\_post や assert ディレクトリなどの内容が更新されると、HTML ファイルを再作成します。
* Web サーバとして機能し、作成したファイルを提供します。
ブラウザを開いて [http://localhost:4000/](http://localhost:4000/) にアクセスすることで、
[Jekyll] によって作成された Web ページを確認できます。

これで手元で Web ページを作成し、確認する環境が整いました。

なお [Jekyll] はファイルが更新されると自動的に HTML ファイルを再作成しますが、
例外として、
設定ファイルである _config.yml は更新しても再作成処理を行いません。
_config.yml を変更した場合には [Jekyll] を一旦終了し、再度

`% bundle exec jekyll s`

と実行する必要があります。

[Blogger]: https://www.blogger.com/
[Jekyll]: https://jekyllrb.com/
[GitHub Pages]: http://pages.github.com/

