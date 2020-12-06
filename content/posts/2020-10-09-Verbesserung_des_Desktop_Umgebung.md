---
aliases:
- 2020/10/09/Verbesserung_des_Desktop_Umgebung.md
date: 2020-10-09 14:01:00 +0200
slug: Verbesserung_des_Desktop_Umgebung
tags:
- 日記
title: デスクトップ環境（物理）見直し
---
自宅で仕事をするようになって机の上が混雑してきたので、
会社から出た予算を使って整理しました。

* ディスプレイをスタンドで上に立てていたのをやめ、
モニターアーム [Ergotron HX デスクモニターアーム] で机の端から伸ばすように。
* ミーティング用のスピーカーフォン [Yamaha YVC-330] を設置。
* キーボードを USB 接続の Happy Hacking Keyboard Professional （初代）から、
無線接続できる [Happy Hacking Keyboard Professional HYBRID Type-S] に置き換え。

{{< image
    path="2020/10/09/desktop.jpg"
    caption="Umgebung auf dem Tisch / デスクトップ環境"
    caption_on_image="true" >}}

ディスプレイを机に乗せてから、
配線がごちゃごちゃしていたのと、
読み書きするのに使うスペースが狭くなり、
ディスプレの裏に隠れてしまった書籍にアクセスするのが面倒になっていましたが、
これで解決しました。

ディスプレイを僅かな力で動かすことができ、
ディスプレイを使わないときには簡単に机の外まで移動できるので、
気軽に背後のものにアクセスしたり、
机の上に作業スペースを作れます。

## [Ergotron HX デスクモニターアーム]

工具不要かつ軽い力で簡単に位置を変えられる一方で、
使っている最中に位置がズレてくるようなことがなく安定しています。

アームに沿ってケーブルを束ねられるので、
位置を変えるときにケーブルが変に伸びたり絡まったりせず快適。

{{< image 
    path="2020/10/09/arm.jpg"
    caption="Ergoton HX Monitor Arm"
    caption_on_image="true" >}}

私は DELL の 30 インチディスプレイを使っているのですが、
想定しているディスプレイはもう少し重い物のようで裏のバネが強く、
ディスプレイを動かす際に意図せず跳ね上げる（チルトする）形になりやすいです。

調整ネジでチルト補助のバネの力を最小にして、
あとはディスプレイの上半分を持って移動するように気をつけています。

## [Yamaha YVC-330]

四〜六人程度の小規模会議用スピーカーフォンということで、
一人で使うには少し大きいです。

ただ、これより小型のモデルにはない

* 一メートル以上離れた場所の音を抑制する
* マイクを自動でミュートする

機能が便利。
子供が隣の部屋で騒いでいたり、
ミーティング中にキーボードで入力しても、
ミーティング進行の邪魔にならないので。

## [Happy Hacking Keyboard Professional HYBRID Type-S]

Happy Hacking Keyboard の Type-S バージョンを使うのは初めてですが、
非常に静かですね。
非 Type-S バージョンの方が「キーを叩いた」実感はあるので、
どちらが良いかは好みの問題。

なお Chromebook では問題なく使えましたが、
仕事用の Linux マシンで GUI ツールを使ってペアリングを試みたところ、
認証に失敗してうまく接続できませんでした。

GUI ツールを使うのをやめて、
コマンドラインから bluetoothctl を使ってペアリングを開始したところパスキーが表示され、
これをキーボードから入力することで無事にペアリングが完了。

```sh
$ bluetoothctl
# power on
# agent on
# default-agent
# scan on
# pair XX:XX:XX:XX:XX:XX    # キーボードの物理アドレス
[agent] Passkey: 123456     # 表示されたパスキーを入力
```

[Ergotron HX デスクモニターアーム]: https://www.ergotron.com/ja-jp/%E8%A3%BD%E5%93%81/%E8%A3%BD%E5%93%81%E8%A9%B3%E7%B4%B0/45-475
[Happy Hacking Keyboard Professional HYBRID Type-S]: https://happyhackingkb.com/jp/products/hybrid_types/ 
[Yamaha YVC-330]: https://sound-solution.yamaha.com/products/uc/yvc-330/index