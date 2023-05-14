---
title: "Anki で教科書体フォントを使う"
date: 2023-05-14T20:50:50+02:00
slug: "anki-mit-kyokasho-font"
tags:
- 教育
---
[Anki を使った漢字の勉強（小学生）]({{< relref path="2020-09-26-ankidroid_for_kanji.md" >}}) で書きましたが、
子供が漢字を学習するために、
Android アプリの [AnkiDroid](https://play.google.com/store/apps/details?id=com.ichi2.anki) を使っています。

Android の標準フォントだと手書きと形が異なる漢字があるので困っていたのですが、
[ソースコード](https://github.com/ankidroid/Anki-Android/blob/490493792b45f73ecaa7267a5fa1548e1b36fab6/AnkiDroid/src/main/java/com/ichi2/libanki/Utils.kt#L917) を読んだところ、
標準ではサポートされていないフォントを使えることが分かりました。

手書きと形が異なる漢字というのは、
たとえばこういうものです。
![](/assets/2023/05/14/sans-serif.png)
ＯＳの言語設定を日本語以外にしていると漢字表示に中国語フォントが使われるため、
さらに多くの漢字で問題が起きます。

ここで Google Fonts で無料公開されている教科書体フォント [Klee One](https://fonts.google.com/specimen/Klee+One) を使うと、
下のスクリーンショットのよううに手書きに近い表示が行えます。

![](/assets/2023/05/14/anki_kyokasho_font.png)


## 手順

### フォントのインストール

教科書体フォントをダウンロードして /sdcard/AnkiDroid/fonts フォルダ置きます。

1. [Files by Google](https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.files) を開き、
｢内部ストレージ｣内の｢AnkiDroid｣フォルダに移動する。
1. 画面右上の︙をクリックし｢新しいフォルダを追加｣を選択。
1. ダイアログが表示されるので fonts と入力して、フォルダを作成。
1. Chrome で Google Fonts の [Klee One](https://fonts.google.com/specimen/Klee+One) のページを開き、
    画面右上の｢Download family｣ボタンをクリックしてフォントをダウンロードする。
1. Files by Google を開き｢ダウンロード｣フォルダに移動する。
1. ダウンロードしたフォントのファイル (Klee_One.zip) があるので、選択して解凍する。
1. 解凍されたフォントファイル (KleeOne-Regular.ttf, KleeOne-SemiBold.ttf) を選択し、
    画面右上の︙をクリックして｢移動｣を選択。
1. 先ほど作成した｢内部ストレージ > AnkiDroid > fonts｣フォルダに移動。

AnkiDroid で教科書体フォントを使用するように設定します。

1. AnkiDroid を立ち上げて画面左上の横三本線をタップ、
    表示されるメニューから｢設定｣を選択。
1. 設定画面が表示されるので｢デザイン｣を選択。
1. 標準フォント System default と表示されているメニューを選択。
1. フォント一覧が表示されるので KleeOne-Regular もしくは KleeOne-Bold を選択。
1. 標準フォントの適用範囲をデフォルトの｢フォントが指定されていない場合｣から｢全て｣に変更。
