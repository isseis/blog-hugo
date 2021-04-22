---
title: "継続的デプロイメント"
date: 2020-12-09T00:29:29+01:00
order: 2
---
GitHub にコンテンツを push すると、
hugo を使ってサイトをビルドし、
その結果を Firebase Hosting にデプロイする。

- [Firebase コンソール](http://console.firebase.google.com/)
- [Buddy](https://buddy.works/)

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

コマンドラインから `firebase deploy --non-interactive` と実行することで、
`public` ディレクトリ以下をデプロイできることを確認しておく。

## Buddy

Webから対話的に設定できる。

1. Buddy から GitHub リポジトリへのアクセスを許可する。
1. プロジェクトを新規作成し、Git Hosting Provider として先に登録した GitHub、その中のリポジトリとしてこのブログの blog-hugo を選択する。
1. Pipeline に Hugo でのビルドプロセスを登録する。
    1. Actions に Hugo を追加。
    1. Environment タブを開き、hugo のインストールスクリプトを編集。新しいバージョンをインストールするように。
    ```sh
    apt-get update && apt-get install -y wget
    wget -O hugo.deb https://github.com/gohugoio/hugo/releases/download/v0.82.1/hugo_0.82.1_Linux-64bit.deb
    dpkg -i hugo.deb
    rm hugo.deb
    ```
    1. Run タブを開きビルドスクリプトを編集する。デフォルトだと `hugo` だけなので、コマンドラインオプションを追加して不要なファイル削除とミニフィケーションを有効に。二行目はこのブログの RSS の URL が途中で変わったことに対する対応なので、通常は不要。
    ```sh
    hugo --cleanDestinationDir --minify
    cp public/index.xml public/feed.xml
    ```
1. Pipeline に Firebase へのデプロイプロセスを登録。
    1. Actions に Firebase を追加
    1. Firebase アカウントを登録（コマンドラインツールを使ってアクセストークンを取得して登録）
    1. Firebase project に blog-hugo-issei を設定
