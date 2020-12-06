---
aliases:
- /2020/09/09/android11-release.html
date: 2020-09-09 15:39:10 +0200
slug: android11-release
tags:
- プログラミング
title: Android 11 公開
---
[Android 11](https://www.android.com/android-11/) が公開されましたが、
私が関わった内容の一部を紹介。

今回、
私は新機能の Bubbles に関連する WindowManager 側の同期処理や、
内部的な処理なのでユーザーから見た変更はないですが ActivityRecord と AppWindowToken 統合に伴ってグチャグチャになっていた visibility 関連の状態管理の整理、
あとは AppTransition 関係で変更を入れてます。

## ActivityRecord と AppWindowToken 統合

Android 10 ではクライアント側の Activity に対応してサーバー側で AppWindowToken というデータ構造が確保されていました。
AppWindowToken は別のサーバー側のインスタンス ActivityRecord と 1:1 対応しており、
いくつかの変更を経て AppWindowToken と ActivityRecord を分離しておく意味がなくなったので統合されたのですが、
副作用として visibility 関係の管理がひどいことに。

たとえば、ActivityRecord は Activity が画面に表示されているか、
それとも非表示状態かを管理しています。
ただし、いきなり表示状態から非表示状態（あるいはその逆）に変更できないので、
まずは表示状態のままで、「これから Activity の終了アニメーションを実行して非表示状態にする」という状態に設定し、
アニメーションを開始してから非表示状態にします
（そうしないとアニメーション開始前にいきなり画面から消えることこなる）。

AppWindowToken と ActivityRecord を統合した結果、
この中間状態を管理するフラグが2つになってしまいました。

* ActivityRecord.visible
* ActivityRecord.hiddenRequested

表示から非表示状態にする場合、
最終的に

* ActivityRecord.visible=false
* ActivityRecord.hiddenRequested=true

に設定する必要があるのですが、
このフラグを読み取る側のロジックの都合で、
片方のフラグは早めに設定して、
もう一方はその段階では更新せずに後になってから更新しないと、
期待通りに動作しない。

他にも基底クラスと派生クラスで意味が一致しなくなっている関数とか、
ほぼ同じだけど微妙に振る舞いが違う

* ActivityRecord.setVisible
* ActivityRecord.setVisibility

などができてしまい、
整理しました。

[ActivityRecord の変更履歴](https://android.googlesource.com/platform/frameworks/base/+log/f2f6c91dd3c4ce44e3ec60d6765d4733835a4a45/services/core/java/com/android/server/wm/ActivityRecord.java) を見ると、
苦労の後が伺えると思います。
一回壊して Revert されました。

## AppTransition

AppTransition は Activity の切り替えを管理してます。

アプリケーション開発者の立場からすると、
Activity の切り替えは Activity を開始したり終了したりする API を呼ぶだけですが、
裏では

1. Activity の表示状態に影響があるイベントが発生する（例：アクティビティを新規に開始する）と、それによって新しく表示されることになる Activity やその親の Task, ActivityStack （まとめて親クラスの WindowContainer で呼びます）、逆にこれまで表示されていたのに非表示になる WindowContainer を特定する。
1. 新規に表示される Activity を実行し、フレームバッファに描画を完了するのを待つ。（スプラッシュ・スクリーンの場合もある）
1. 表示→非表示、非表示→表示になる WindowContainer に対して、それぞれイベントや WindowContainer の種類に応じたアニメーションを適用する。
1. WindowContainer の表示・非表示を管理するフラグを更新する
1. アニメーション終了を待つ

といった処理を行っています。

このあたりの設計は全画面アプリケーションしかない自体の設計をひきずっているところがあって、
すべてが Activity ベースになっており、
そのために直せないバグや不必要に複雑になっているコードがありました。

まだ道半ばですが、
とりあえずアニメーションを適用する対象を ActivityRecord から Task など親の WindowContainer に変更できるようにしました。
下準備はいろいろ大変でしたが、
最終的にアニメーション対象を ActivityRecord から親に格上げする [コード](https://android.googlesource.com/platform/frameworks/base/+/737b7f16208c455eb392fbee8e681597ebeb48d1/services/core/java/com/android/server/wm/AppTransitionController.java#397) は、
シンプルな再帰処理。


参考: [AppTarnsitionController の変更履歴](https://android.googlesource.com/platform/frameworks/base/+log/refs/heads/android11-release/services/core/java/com/android/server/wm/AppTransitionController.java)

## Bubbles

[Bubbles](https://developer.android.com/guide/topics/ui/bubbles) は
[Notifications](https://developer.android.com/guide/topics/ui/notifiers/notifications) の拡張となってますが、
Notification とは違って任意の Activity を実行して描画させることができます。

通常の UI であれば OS が AppTransition を使って、
適切なタイミングでアクティビティを表示したり開始・終了アニメーションを適用するのですが、
Bubbles は OS のコア部分とは切り離して [System UI](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/android11-release/packages/SystemUI/) で実装されているので、
この同期処理を一部 System UI で実装する必要があります。

Android 10 の段階で一通り実装したのですが、
いくつかバグが残って 11 で直しきった感じです。
Bubbles の同期処理は DisplayManager, WindowManager, SystemUI, (Bubblesの中で実行されている) Activity, RenderThread など非同期通信するスレッドが複数関与するので、
ここでバグがあるとデバッグが極めて面倒。

[Fix bubble shows empty contents after rotating the device](https://android.googlesource.com/platform/frameworks/base/+/f76ce36997220a482571625fd51274a8e5a11d11%5E%21/#F0) とか実質的には

```java
+            } else if (isSingleTaskInstance()) {
+                updateTransitLocked(TRANSIT_SHOW_SINGLE_TASK_DISPLAY, options,
+                        true /* forceOverride */);
```

だけの変更ですが、
原因を突き止めるのが大変でした。
