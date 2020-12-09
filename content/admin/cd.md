---
title: "継続的デプロイメント"
date: 2020-12-09T00:29:29+01:00
order: 2
---
GitHub にコンテンツを push すると、
hugo を使ってサイトをビルドし、
その結果を Firebase Hosting にデプロイする。

- [Travis CI](https://travis-ci.com/)
- [Firebase コンソール](http://console.firebase.google.com/)

## Travis CI

### Travis CI が GitHub リポジトリにアクセスできるようにする

https://github.com/settings/installations/11971036

### Travis CLI をインストール

Ruby を インストールして、次のコマンドを実行。
```sh
gem install travis
```

プレインストールされている Ruby のバージョンが古い場合には、
事前に [rbenv](https://github.com/rbenv/rbenv) を使って新しいバージョンをインストールしておく。

### 設定ファイル

.travis.yml
```yml
dist: focal
addons:
  snaps:
  - hugo
script:
- hugo
- cp public/index.xml public/feed.xml
```

最後の行は後方互換性維持のため。
jekyll は feed.xml というファイル名で RSS フィードを出力するので、
それを読むように設定している人のために。

### 通知

公式ドキュメント [Configuring Slack notifications](https://docs.travis-ci.com/user/notifications/#configuring-slack-notifications) 参照。


#### SLack app に Travis CI を追加

* ビルドの成否に関わらず通知
* 通知にはメールではなく Slack を使う

```yml
notifications:
  slack:
    on_success: always
    on_failure: always
  email: flase
```

Travis CI から Slack のチャンネルにポストするために必要な Token を生成する。

1. [Slack app directory - Travis CI](https://isseiworkspace.slack.com/apps/A0F81FP4N-travis-ci) で、
左にある Zu Slack hinzufügen ボダンをクリック。
2. メッセージをポストするチャンネルを選択して Travis CI-Integration hinzufügen をクリック。
3. Token を暗号化して .travis.yml に追加。

```sh
travis encrypt "<account>:<token>#channel" --add notifications.slack.rooms
```

## Firebase

### Firebase でホスティング先を作成する

[Firebase コンソール](http://console.firebase.google.com/)

1. プロジェクトを追加
2. プロジェクト内で Hosting を追加。

### Git リポジトリに Firebase ホスティング情報を登録
[Firebase CLI](https://firebase.google.com/docs/cli) をインストールしておく。

Glog のトップディレクトリで firebase の設定ファイルを作成。

```sh
firebase login
firebase init
```

これで次のファイルがローカルに作成されるので、
git リポジトリに追加する。

.firebaserc
```yml
{
  "projects": {
    "default": "blog-hugo-issei"
  }
}
```

firebase.json
```yml
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

### ビルド後に Firebase Hosting にデプロイする

```yml
deploy:
  provider: firebase
  skip_cleanup: true
```

公式ドキュメント [Generating your Firebase token](https://docs.travis-ci.com/user/deployment/firebase/#generating-your-firebase-token) にしたがって、
git リポジトリで次のコマンドを実行してアクセストークンを作成。

```sh
firebase login:ci
```

暗号化して .travis.yml に追加。

```sh
travis encrypt "TOKEN" --add
```
