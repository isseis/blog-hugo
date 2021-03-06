---
title: "ソースコード読みの技術"
date: 2020-12-11T21:46:13+01:00
slug: "source-code-reading"
tags:
- プログラミング
---
仕事でプログラムを描いていると、
他人が書いたソースコードを読んで内容を理解する必要に迫られます。
ちょうど一つ読み終わってデザインドキュメントを書いたところなので、
今現在の私のソースコードの読み方をメモ。

## 背景

規模が小さいコードならざっと全体に目を通したり、
とりあえず適当に変更して様子を見ながら理解することもできるけれど、
これが Android のような巨大なコードベースとなると全部を読んで理解するのは物理的に無理なので、
戦略的に取り組む必要がある。

## 取っ掛かりをつかむ

最初に必要なのは、
どのあたりのコードを読めば良いのかの当たりをつけること。

過去に自分が書いたコードだったり、
詳細は知らなくてもアーキテクチャの概要を把握している場合には、
深く調査しなくても関係しそうなクラスや関数の目星がつくことがある。
あとはデバッグ出力を有効にして、
ざっと眺めてみるとヒントになることも。

よく分からない場合には、
そのコードを書いた本人に聞く。
この段階ではコードの詳細を把握できていないので、
自分がやりたいことを簡単にまとめて、
関係しそうな人に聞いてみる。
問い合わせ先に顔が広いマネージャーも含めておくと、
最初に連絡をとった相手が間違っていた場合でも適切な相手にフォワードしてくれるので、
話が進みやすい。

運が良ければデザインドキュメントが出てきて、
設計の背景などを含めて概要を把握できる。
必要に応じてコードを理解している人間にホワイトボードを使って概要を解説してもらう。

この際、
漠然と「解説してほしい」とリクエストすると相手も困るので、
自分がやりたいこと（実装したい新機能）などを簡単に伝えて、
それに関わる部分を解説してもらう。
あらかじめ１、２ページにまとめた文書 (one pager) を作っておくと、
別の人に話を聞きに行ったり、
逆に後日別のプロジェクトの人が話を聞きに来た場合に使いまわしが効いて便利。

ホワイトボードセッションでは、

* 略語
* ログの読み方
* デバッグ機能があれば、それを有効にする方法
* 関連するコンポーネントとそのオーナー（疑問があった場合の連絡先）
* 現在進行中のプロジェクトで影響がありそうなもの

についても聞き取っておく。

自分がやろうと思っていることが既存のプロジェクトとバッティングしていたり、
そうでないにしても予定されている大規模なリファクタリングに巻き込まれたりすると、
大きな時間のロスにつながる。

## 静的構造を把握する

プログラムは実行してみないと分からない動的な側面と、
コードを読むだけで分かる静的な側面がある。

まずは第三者の手助けなしでも進めやすい、
静的な側面から取り組む。

複数のシステムで構成されるシステムの場合、
まずは構成要素を洗い出して、
どのシステムが繋がっているのかを図にする。
構成要素は Web だとサーバーやフロントエンドになり、
Android OS だと Binder で通信するプロセスが構成要素になる。

次に個々のシステム内部を調査。
Java のようなオブジェクト指向プログラミング言語の場合には、
主要なインターフェースを洗い出して、
クラスの継承関係やどのクラスがインターフェースを実装しているかを把握するために図を書くと良い。

私は UML のクラス図の記法を参考にしているけれど、
細かいところは適当。
継承関係と、
クラス間のつながり、
あとはインスタンスの寿命管理を行っているのがどれかが明確になれば大体 OK。

Java だと無名クラスやラムダ式もあるので、
陽にクラス名が出ていなくても重要なコードだったり、
実は他のクラスにつながる経路が存在したりする。
どこまで細かく描くかはコードを読んだり、
次の動的振る舞いの調査をしながら決める。

この段階でわからないことがあれば、
メモにまとめておく。

## 動的振る舞いを追跡する

次に実際にプログラムを実行したときに、
どのコードパスを通るのかを調べる。

まずは統合開発環境のエディタや [Code Search](https://developers.google.com/code-search) などを使って、
主要な関数呼び出しを追ってみる。
ただしコードを読むだけだと、

- 条件分岐がある場合に実際にはどのパスを通っているのか
- インターフェースや基底クラス経由で呼び出している場合、実際にはどのクラスの関数が呼ばれているのか

が分からない事があるので、
そのときにはデバッガを使ったりログメッセージを各所に仕込んで調べる。
Android だと logcat を関連しそうな場所に大量に埋め込んでログを取るのが楽。
場合によっては、
ログにスタックトレースを含めるのも良い。

ただし logcat だと「ここは関係ないだろう」と logcat を埋め込まなかった場所はすっぽり抜け落ちてしまうので注意。
デバッガのステップ実行と組み合わせて使う。
ただしログを出力しすぎると重要な情報が埋まってしまうし、
足りないと見落とすのでバランスが難しいが、
そこは経験と勘でどうにかする。

処理が特に複雑だったり依存関係がありそうな場合には、
関数の呼び出しシーケンスをクラス図に書き込んだり、
シーケンス図を描いてみる。

ある程度理解が深まったところで、
疑問をまとめて再質問する。
場合によっては深堀りする部分を決めて、
もう一度ホワイトボードセッションを開いても良い。

### Android OS 解析のためのツール

動的振る舞いの追跡には、
システム固有の知識やツールが有用。
多少時間がかかっても最初に存在するツールを調べて、
使い方を学んでおいたほうが良い。

すでにツールを使っている人や現在メンテナンスしている人に時間をとってもらって、
隣りに座って一緒に画面を見ながら教えてもらうと早い。
簡単なバグのデバッグや小さな機能拡張など、
現実のタスクを行いながらツールを使ってみる。
漫然と説明を聞いていると眠くなる。

Android OS の場合には、次の２点がコードを追うのを難しくしている。

1. Binder (IPC) 呼び出し
1. Handler によるメッセージ通信

これが間に挟まるとスタックトレースが取れないので、
コードを読むしかない。

Android OS で特に私が関わっている WindowManager まわりだと、
[TRracing Window Transitions](https://source.android.com/devices/graphics/tracing-win-transitions) にある Winscope や、
[system tracing](https://developer.android.com/topic/performance/tracing) が役に立つこともある。

## 個人からチームへ

足がかりを築いたら、
デザインドキュメントのレビューやコードレビューに参加することで、
継続的に知識を更新する。
こうすることで徐々に見通しがつくコードが増えていく。

またチームで知識を共有するために、
定期的にスタンドアップミーティングやミニテックトークを開催するのも有効。

チームの規模が小さいうちはスタンドアップミーティングで質問したり、
質問があるときにアドホックにホワイトボードセッションを開催するので十分。
形式張らないほうがうまくいく。

ある程度チームが大きくなってきたら持ち回りで発表することにして、
プレゼンターは簡単な資料を用意する。
聴衆が増えるにつれて各人の理解度合いや興味が拡散していくので、
技術的に深堀りしたい場合には少人数で行い、
人数が多い場合にはアーキテクチャや技術的背景といった俯瞰的なテーマをとりあげる。
経験が浅いエンジニアには、
最初に何度か他のエンジニアが発表するのを見せてからプレゼンターを割り振る。
またテーマの決め方や資料の構成に関して手助けと助言を行う。

自分が他のオフィスに出張する際には、
相手オフィスのエンジニアに依頼してテックトークを行う手はずを整えてもらう。
逆に誰かが自分のオフィスに出張してくる場合には、
テックトークを手配する。
こういう時に顔をつないでおくと、
後で質問する時に話が通りやすい。

また新しく人がチームに加わるタイミングで、
新規メンバー向けの集中講義を行う。
すでにいるチームメンバーが自分の担当領域についてホワイトボードセッションを行い、
加わった人間が短時間でキャッチアップできるようにする。
すでにチームにいるメンバーでも、
他のメンバーが関わっているプロジェクトはよく分かってないこともあるので、
この機を使ってチーム全体の底上げを図るのも良い。
