---
title: "継続的デプロイメント"
date: 2020-12-09T00:29:29+01:00
order: 2
---
GitHub にコンテンツを push すると、
Cloudfront Pages で hugo を使ってサイトをビルドし、
デプロイする。

## Cloudfront Pages 設定方法

[Cloudfont コンソール](https://dash.cloudflare.com/)

1. メニューから Pages を選択し、
  プロジェクトを作成。
  Git 接続し blog-hugo レポジトリを選択。
1. カスタムドメインとして blog2.issei.org を設定。
1. ビルドの構成は hugo を選択。
  ビルドコマンドは `hugo --minify` と `--minify` オプションを付けておくと、
  生成されるファイルの容量が削減される。
1. 環境変数 `HUGO_VERSION` を設定し、
  使用する hugo バイナリのバージョンを指定する。

Cloudflare 側で `*.pages.dev` という URL を割り当てるので、
`blog2.issei.org` の別名として設定しておく。

Cloudflare に DNS を移管した場合は reverse proxy を使用可能。
クライアントに直接 blog をホスティングしている `*.pages.dev` にアクセスさせる代わりに、
Cloudfront のエッジサーバーにアクセスさせ、
そこから blog にアクセスさせることが可能。

## Firebase 設定方法（停止中）

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

## Buddy 設定方法（停止中）

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

### 制限

Buddy はキャッシュサイズが 500MB に制限されている。
写真の JPG ファイルをすべて Git リポジトリに追加しているため、
容量を超える可能性がある。

## GitHub Actions 設定方法（停止中）

[設定ファイル](https://github.com/isseis/blog-hugo/blob/master/.github/workflows/main.yml) の作成、動作確認済み。

有効にすると GitHub リポジトリへの push イベントをトリガーとして、
仮想マシンで Hugo を使ってサイトをビルド後、
Firebase と、
GitHub アカウント isseis-gh を使用してプロジェクトページの gh-pages ブランチの２箇所にデプロイする。

### [GitHub Actions for Hugo](https://github.com/peaceiris/actions-hugo)

仮想マシンに Hugo をインストールする GitHub Action。
使用するバージョンを指定するか、
あるいは最新版を常に使う場合には `latest` としておく

このサイトでは SCSS を使っているので、
SCSS 対応の hugo バイナリをインストールするために `extended: true` と指定しておく。

### [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)

仮想マシンから Firebase にファイルをデプロイする GitHub Action。
Google 公式ではないが、Google の有志がメンテしている

1. GitHub から Firebase プロジェクトにアクセスするためのサービスアカウントを作成し、
  アカウントの JSON キーを GitHub リポジトリの encrypted secret に登録する。
  firebase CLI で次のコマンドを実行するだけで、一連の処理をしてくれる。
    ```sh
    firebase init hosting:github
    ```
1. firebase CLI の出力メッセージに従って `firebasesServiceActount` を設定。
1. 合わせて `projectId` を Firebase でホスティングするプロジェクトの ID にし、
  `channelId: live` として本番環境へのデプロイを指示

### 再開方法

1. [GitHub Actions - Select workflow](https://github.com/isseis/blog-hugo/actions/workflows/main.yml)<br/>
  Enable workflow
1. [GitHub Pages - Setting - Pages](https://github.com/isseis/isseis.github.io/settings/pages)<br/>
  Source: Branch gh-pages
