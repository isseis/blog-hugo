---
title: "継続的デプロイメント"
date: 2020-12-09T00:29:29+01:00
order: 2
---
GitHub にコンテンツを push すると、
自動的に hugo を使ってサイトをビルドし、
ビルドされたサイトを Firebase Hosting にデプロイする。

- [Firebase コンソール](http://console.firebase.google.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Firebase

### Firebase でホスティング先を作成する

[Firebase コンソール](http://console.firebase.google.com/)

1. プロジェクトを追加
2. プロジェクト内で Hosting を追加。

### Git リポジトリに Firebase ホスティング情報を登録
[Firebase CLI](https://firebase.google.com/docs/cli) をインストールしておく。

blog のトップディレクトリで firebase の設定ファイルを作成。

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

## GitHub Actions

GitHub Actions のワークフローは、
実際には .github/workflows ディレクトリ下に置いた yml ファイルで制御される。

エディタで作成したものを直接 GitHub リポジトリに push しても良いが、
Web で雛形を作る機能がある。

1. GitHub のコンソールからプロジェクトを選択し、Action タブを開く。
2. New workflow をクリックして、新規ワークフロー作成画面に。
3. set up a workflow yourself をクリックして .github/workflows/main.yml の編集画面に。

.github/workflows/main.yml
```yml
name: Firebase

on:
  push:
    branches:
      - master

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true  # Fetch Hugo themes (true OR recursive)
          fetch-depth: 0    # Fetch all history for .GitInfo and .Lastmod

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.82.1'
          extended: true

      - name: Build
        run: hugo --cleanDestinationDir --minify

      - run: cp public/index.xml public/feed.xml

      - name: Deploy
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT_BLOG_HUGO_ISSEI }}"
          projectId: blog-hugo-issei
          channelId: live
```

### [GitHub Actions for Hugo](https://github.com/peaceiris/actions-hugo)

Gi仮想マシンに Hugo をインストールする GitHub Action。
使用するバージョンを指定するか、
あるいは最新版を常に使う場合には `latest` としておく。

このサイトでは SCSS を使っているので、
SCSS 対応の hugo バイナリをインストールするために `extended: true` と指定しておく。

### [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)

仮想マシンから Firebase にファイルをデプロイする GitHub Action。
Google 公式ではないが、Google の有志がメンテしている。

1. GitHub から Firebase プロジェクトにアクセスするためのサービスアカウントを作成し、
  アカウントの JSON キーを GitHub リポジトリの encrypted secret に登録する。
  firebase CLI で次のコマンドを実行するだけで、一連の処理をしてくれる。
    ```sh
    firebase init hosting:github
    ```
1. firebase CLI の出力メッセージに従って `firebasesServiceActount` を設定。
1. 合わせて `projectId` を Firebase でホスティングするプロジェクトの ID にし、
  `channelId: live` として本番環境へのデプロイを指示。
