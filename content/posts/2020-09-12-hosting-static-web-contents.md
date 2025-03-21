---
aliases:
- /2020/09/12/hosting-static-web-contents.html
date: 2020-09-12 17:40:42 +0200
slug: hosting-static-web-contents
tags:
- システム運用
- blog
title: 静的 Web コンテンツ作成・配信環境
---
久しぶりにブログ（というか往年の Web 日記というか）を書き始めて、
あらためて静的なコンテンツを作成し Web で公開するための環境について調べています。

ここ10年ぐらいバックエンドやモバイル関係の仕事が主だったので、
Web のフロントエンド系の知識が更新されてませんでした。
多少なりとも実際に使ってから調べると、理解が早い。

## コンテンツ作成

### 背景

静的な Web コンテンツを配信するだけなら、原始的には

1. Linux マシンを一台用意して
1. Apache をインストール
1. HTML を手書きして index.html ファイルを作る
1. Linux マシンの適当なディレクトリに index.html ファイルを置く
1. Linux マシンをインターネットに繋ぐ

だけで動きます。

HTML を CSS, Javascript と合わせて手書きすることは可能ですが、
やりたいことに対して記述量が増えて大変です。
単一ページの作成だけでなく Web サイトを構成するという観点だと、
たとえばブログで新規エントリを書く度に「最新エントリ一覧」も合わせて手作業で更新することになり、
だんだん辛くなってきます。

静的な Web コンテンツが主体であっても、
一部には動的な要素を入れたくなることがあります。
たとえばブログにユーザからのコメント欄を設ける場合、
完全に静的な作りだとコメントを即時に表示することはできず、
一旦コメントを製作者が受け取った上で、
それを手作業でコンテンツに反映することになります。

### フロントエンドスタック

そこで人間は本質的なコンテンツ作成に注力し、
それ以外の部分は自動的に処理できるようにしたくなりますが、
そのためのフロントエンドスタックの構成方法の一つとして [Jamstack] があります。

Jam は Javascript + API + Markup の意味ですが、これは大きく二つに分けられます。

| 技術 | コンテンツの種類 | 意味 |
| - | - | - |
| Javascript + API | 動的コンテンツ | クライアントから外部のマイクロサービスを呼び出す |
| Markup | 静的コンテンツ | 事前に HTML, CSS などを作成しておく |

このブログは [Jekyll] + [GitHub Pages] で作っていますが、
これがまさに Jasmstack の例。
以前に [tDiary] という Web 日記システムを使っていたことがありますが、
比較すると構成の違いが分かりやすいです。

#### Markup

マークアップは文書の構造（見出し、段落、リンクなど）を定義することですが、
Web の世界だと文書を HTML で記述することほぼ同義です。

[Jekyll] と [tDiary] いずれも、
エントリを書くときには人間が書きやすい記法を使いますが、
そのままではブラウザに表示できないため、
どこかのタイミングで HTML に変換する必要があります。

[tDiary] (非jamstack) では変換前のエントリとプログラムを配信サーバに配置し、
ブラウザからアクセスがあった時点で配信サーバー上でプログラムが HTML を作成してブラウザに送ります。

![tDiary コンテンツ作成フロー](/assets/2020/09/jamstack/contents-building-tdiary.png)
    
この方法には利点も多いのですが、一方で次のような欠点もあります。

* コンテンツ配信サーバー上でプログラムを実行する
    * セキュリティ上の問題を生じやすい。
* コンテンツが動的に作成される
    * CDN を使えないため、ユーザがアクセスするのに時間がかかる。
    * アクセス数に比例してビルド回数が増え、サーバーの処理能力が必要になる。

[Jekyll] (jamstack) では先に簡易記法で記述したエントリを HTML に変換し、
変換済みの HTML ファイルを配信サーバーに配置します。

![Jekyllコンテンツ作成フロー](/assets/2020/09/jamstack/contents-building-jamstack.png)

このデザインでは [tDiary] の場合の欠点が解消していることが分かります。

* ビルドサーバー上でプログラムを実行する
    * ビルドサーバーにはコンテンツ制作者のみアクセスできれば良いため、セキュリティ上の問題が生じにくい。
* コンテンツが静的に作成される
    * CDN を使ってユーザに近いサーバーにコンテンツを置いて置けるため、アクセスが高速になる。
    * アクセス数によらずビルド回数は一定なので、サーバーの処理能力を増強する必要がない。

なお HTML への変換処理はコンテンツ制作者の手元の PC で行うこともできますが、
そうすると PC が単一障害点になり、
また環境依存の問題も起きやすいので、
ビルド環境を別に用意した方が良いです。

#### Javascript + API

ページ中で動的な処理を行いたい場合、
たとえばブログにリアルタイムで投稿を反映可能なコメント欄を設置する方法。

[tDiary] では配信サーバー上に置かれたプログラムがコメントを管理します。
HTML を作成するときにコメントのデータを取得して埋め込みます。

![tDiary 動的コンテンツレンダリングフロー](/assets/2020/09/jamstack/dynamic-contents-tdiary.png)

このデザインではコンテンツ配信サーバー上でプログラムを動かす必要があり、
上記の [Markup](#markup) での欠点がそのまま残ります。

またコメントのデータの保存方法についても、
単にサーバー側のローカルディスクに置くとハードディスクトラブルなどで容易に失われてしまいます。
別途データベースサーバーなどを用意することも考えられますが、
今度はデータベースサーバーの設定・運用コストが大きくなります。

[Jekyll] では配信サーバーとは別に、
コメントだけを管理する [Disqus](https://disqus.com/home/settings/account/) などの外部サービスを利用します。
配信サーバーからは Javascript で記述された外部サーバーと通信するための小さなプログラムを送り、
実際のコメントの取得と表示、投稿などはクライアントが外部サーバーと通信して行います。

![Jekyll 動的コンテンツレンダリングフロー](/assets/2020/09/jamstack/dynamic-contents-jamstack.png)

コンテンツサーバー上にはプログラムを設置することなく、
ユーザには動的なコンテンツを含んだ Web ページを提供することができます。
また外部サービスの追加も容易です。

### 静的サイト構築フレームワーク

GitHub で人気があるもの上位。

| フレームワーク名 | プログラミング言語 | フレームワーク |
| - | - | - |
| [Next.js](https://nextjs.org/) | Javascript | React |
| [Gatsby](https://www.gatsbyjs.com/) | Javascript | React |
| [Nuxt](https://nuxtjs.org/) | Javascript | Vue.js |
| [Hugo](https://gohugo.io/) | Golang |
| [Jekyll](https://jekyllrb.com/) | Ruby |

個人的には [Jekyll] しか使ったことはないですが、
後で他も見てみたいです。

## コンテンツ配信

サイトを構築したら、
インターネット上のサイトに置いてアクセス可能にする必要があります。

### 静的サイト向けホスティングサービス

* [Netlify](https://www.netlify.com/)
* [GitHub Pages](https://pages.github.com/) 

静的サイト向けのホスティングサービスなので、
ロードバランシングや CDN などは相手におまかせ。

GitHub からの継続的インテグレーション、継続的デプロイメント (CI/CD) に対応しているので、

1. GitHub にリポジトリを作っておいてコンテンツはそこに push
1. リポジトリの変更をトリガとして、ホスティングサービス側でサイトのビルドを開始
1. ビルドしたコンテンツを配信サーバ上に配置

というフローを簡単に作れます。

[GitHub Pages] は [Jekyll] で作成したコンテンツの配信先としてカジュアルに使うには良いですが、
本格的に使おうとすると制約が多いです。

### クラウドストレージ

汎用のクラウドストレージにファイルを置いて、
それにロードバランサーや CDN を組み合わせることで、
サイトを構築することができます。

* [AWS S3](https://docs.aws.amazon.com/s3/index.html) + [CloudFront](https://aws.amazon.com/de/cloudfront/)  
* Azure Storage ([Static website hosting in Azure Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website))
* [Google Cloud Storage + Cloud Load Balancing](https://cloud.google.com/storage/docs/hosting-static-website)

## 技術的背景

[Jamstack] のコンセプトが広まったのは2017年からのようですが、
それまではアイデアとしてはあっても技術的に現実的ではなかったんでしょうかね。

基盤として、次のような前提が成り立って初めて、今の形の静的サイト構築＋動的コンテンツ埋め込みが可能になります。

* ソースコードのホスティング先として GitHub が安定したサービスを提供
* コンテナ仮想化により CI/CD が低コスト・高速に行えるように
* 安価に CDN を使えるように
* Javascript フレームワークならびにブラウザが熟成し、マイクロサービスを組み合わせて使うのが容易に

[Jamstack]: https://jamstack.org/
[Jekyll]: https://jekyllrb.com/
[GitHub Pages]: https://pages.github.com/
[tDiary]: https://github.com/tdiary
[Netlify]: https://www.netlify.com/
