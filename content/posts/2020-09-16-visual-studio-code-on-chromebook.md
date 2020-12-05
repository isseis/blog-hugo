---
title:  Visual Studio Code を Chromebook で使う方法と、Chrome OS のレンダリングパイプライン
tags:   ["プログラミング"]
date:	2020-09-16 21:25:29 +0200
slug:   visual-studio-code-on-chromebook
aliases:
    - /2020/09/16/visual-studio-code-on-chromebook.html
---
Chromebook で使えるエディタを探していたところ、
[Visual Stuido Code](https://code.visualstudio.com/) が Chrome OS 上の Linux (beta) で使えることが判明。
ただし私の環境で普通に使うと表示がぼやけるため何が問題なのか調べていたら、
Chrome OS のレンダリングパイプラインの文書にたどり着いて、
興味深く読みました。

## Visual Studio Code を Chrome OS で使う

Visual Studio Code は Windows, MacOS に加えて Linux 向けにも公式にバイナリが提供されています。
Chrome OS でも [Linux 向けのプログラムを実行することが可能](https://support.google.com/chromebook/answer/9145439) なので、
公式バイナリをインストールするだけで使えます。

ただし私の環境だと表示がぼやけてしまい、
またパフォーマンスも良くないです。

そもそも、
どうやって Linux の GUI アプリケーションを Chrome OS で表示しているのかが気になって調べたところ、
Sommelier  + Wayland を使っている模様（[参考](https://chromium.googlesource.com/chromiumos/platform2/+/HEAD/vm_tools/sommelier/)）。

Wayland は抽象化された compositor インターフェースで、

1. マウスやキーボードイベントをクライアントに渡す
1. 各クライアントが描画したサーフェスを合成する

のが主な役割。

参考: [X vs. Wayland Archtecture](https://wayland.freedesktop.org/docs/html/ch03.html#sect-Wayland-Architecture-wayland_architecture)

Linux 上の GUI アプリケーションは通常 X lib を使って入力を受け取ったり描画を行います。
ネイティブの Linux 環境では

1. アプリケーションが X lib を呼び出す
1. X lib が X server と通信
1. X server が Linux kernel と　DRM (Direct Rendering Manager) / KRM (Kernel mode Setting) を介して通信
1. Linux kernel がデバイスドライバを介して物理的なデバイス（キーボード、マウス、ディスプレイなど）と相互にやりとり

という過程を経ますが、
Chrome OS 上だと次のようになる（入力は逆の経路を通ってアプリケーションに届けられる）。

1. アプリケーションが X lib を呼び出す
1. X lib が Chrome OS が提供する XWayland と通信
1. XWayland がウィンドウの描画イメージを作成し、Chrome OS 側のウィンドウマネージャー Aura に渡す
1. Aura がウィンドウの表示位置などを設定した上で、下位レイヤーに表示を依頼

おそらく Aura とのやり取り部分が性能のボトルネックになっていて、
また Chrome OS 上で表示倍率を 1.0 以外に設定している場合にはビットマップイメージの拡大・縮小が行われ、
表示がぼやけてしまうんでしょう。

### code-server

Visual Studio Code はソースコードが公開されているので、
直接 X lib を呼び出す代わりに HTML を出力してブラウザからアクセスできるようにした [code-server](https://github.com/cdr/code-server/blob/v3.5.0/doc/guide.md) が作られて公開されています。
Chrome OS 上の Linux (beta) で code-server を実行し、
Chrome OS のブラウザからアクセスすると性能的にも遜色なく使えます。

インストール手順

```shell
curl -fOL https://github.com/cdr/code-server/releases/download/v3.5.0/code-server_3.5.0_amd64.deb
sudo dpkg -i code-server_3.5.0_amd64.deb
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Chrome OS のレンダリングパイプライン

Chrome OS は Linux 上に構築されているので描画に X11 を使っているのかと思っていたら、
2015年には状況が変わっていました。

[USING THE CHROME OS* GRAPHICS STACK ON INTEL-BASED LINUX* DESKTOPS](https://01.org/blogs/joone/2018/using-chrome-os-graphics-stack-intel-based-linux-desktops)

![](https://01.org/sites/default/files/users/u32403/chrome_graphics_arch.png)

Aura は X lib を呼び出す代わりにプラットフォーム非依存の低レベル入出力・グラフィックスを抽象化した Ozone を使い、
Ozone がプラットフォーム依存のバックエンド Ozone-gbm を介して Linux kernel (DRM/KMS) とやりとりします。

Ozone には Linux kernel とやりとりする Ozone-gbm 以外にも、
Chromecast とやりとりする Cast や、
Wayland ディスプレイプロトコルを使うバックエンドなど様々あるようです。

参考: [Ozone Platform](https://chromium.googlesource.com/chromium/src.git/+/master/docs/ozone_overview.md#ozone-platforms)

### ARC++

Chrome OS 上では ARC++ (Android Runtime App Runtime for Chrome) を使って Android アプリケーションも動作させることができます。

Android アプリケーションを作成する場合、
通常は View や Canvas を使いますが、
最終的には Open GL ES の命令セットになり GPU を使ってレンダリングされます。
ハードウェアサポートがない場合やソフトウェアレンダリングが指定された場合には、CPU がレンダリングしますが、
そうなるとかなり遅くなってします。

そこで ARC++ ではハードウェアアクセラレーションを使えるように、
Render-node にアクセスするパスが用意されています。

参考: [Arc++ Graphics](https://qiangbo-workspace.oss-cn-shanghai.aliyuncs.com/2019-09-10-chromeos-with-android-app/Arcpp_Graphics.pdf)


## Wayland

ドキュメントを読んでいると Wayland は

1. 抽象化された compositor インターフェース（プロトコル）
1. Wayland インターフェースを実装した特定の C ライブラリ

両方の意味で使われていて、
若干ややこしいです。
厳密に区別したい場合には、次の呼称を使うようです。

| 名前 | 意味 |
| - | - |
| wayland-client | Wayland プロトコルを使うアプリケーション |
| wayand-server | 抽象化された compositor |
| wayland-EGL | Open GL ES の命令セットを出力する compositor の一実装 |

また Linux 上で動く GUI アプリケーションは伝統的には X lib を使いますが、
Gnome や KDE といったフレームワークを使っている場合には X lib の代わりに wayland も使えるようです。
