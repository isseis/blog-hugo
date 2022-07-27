---
title: "Slack から Mattermost へ移行"
date: 2022-07-27T18:56:52+02:00
slug: "slack-to-mattermost"
tags:
- プログラミング
---
家族間の連絡に Slack のフリープランを使っていましたが、
2022年9月からフリープランの制約が変更になり90日以前のメッセージが非表示になるとのこと。

- [プロプランの料金改定とフリープランの最新情報](https://slack.com/intl/ja-jp/help/articles/7050776459923-%E3%83%97%E3%83%AD%E3%83%97%E3%83%A9%E3%83%B3%E3%81%AE%E6%96%99%E9%87%91%E6%94%B9%E5%AE%9A%E3%81%A8%E3%83%95%E3%83%AA%E3%83%BC%E3%83%97%E3%83%A9%E3%83%B3%E3%81%AE%E6%9C%80%E6%96%B0%E6%83%85%E5%A0%B1)

有料プランは一人あたり年間 81 EUR とプライベートで使うにはやや高いのと、
今後も急な価格改定やサービス内容の変更があると困るので [Mattermost](https://mattermost.com/) に移行することにしました。
Mattermost は主要機能がオープンソースで開発されており、
基本機能だけであれば無料で使用可能です。

また Mattermost 社が提供するサーバーを無料プランで利用する場合にはアクセス可能なメッセージ数が1万件に制限されますが（以前の Slack フリープランと同じ）、
自分でサーバーを用意するとメッセージ数の制限もなくなります。

- [Mattermost Pricing](https://www.notion.so/Slack-Mattermost-9eb272cde4c04eb8a6db804cefe909b0)

ただし導入・運用の手間がかかるので、
自分でサーバーを用意するのはシステム管理経験者以外にはお勧めしません。

## 導入

私は自分で管理している VPS (Virtual Private Server) があるので、
そこに Mattermost 環境をインストールしました。
Mattermost 社が Docker イメージと Docker Compose の設定ファイルを提供しているので、
導入はほぼ公式ドキュメント [Deploy Mattermost](https://docs.mattermost.com/guides/deployment.html) に従うだけです。

他に必要だった作業は、
VPS のパケットフィルタを変更して HTTP ポート 443 に接続可能にしたことと、
DNS の設定ぐらいでしょうか。

## データ移行

データを Slack からエクスポートして Mattermost に移行する手順は、公式文書 [Migrating from Slack](https://docs.mattermost.com/onboard/migrating-to-mattermost.html#migrating-from-slack) に記載があります。
これも基本的に文書に従うだけですが、いくつか落とし穴がありました。

### 添付ファイル

公式文書にはインポート用のファイル mattermost-bulk-import.zip の作成方法が次のように記載してありますが、
後でインポートに使用する mmctl コマンドがエラーを返します。
エラーメッセージをみると mmctl コマンドは添付ファイルが zip ファイル中の data サブディレクトリに以下あることを期待しているようです。

```sh
zip -r mattermost-bulk-import.zip bulk-export-attachments mattermost_import.jsonl
```

そこで data ディレクトリを作って bulk-export-attachments をその下に移動した上で、mattermost-bulk-importer.zip を作成したところ、データのインポートを正常に行えるようになりました。

```sh
mkdir data
mv bulk-export-attachments data
zip -r mattermost-bulk-import.zip data mattermost_import.jsonl
```

### インポート

作成した mattermost-bulk-import.zip は mmctl コマンドを使って Mattermost サーバーにインポートします。

リモートからインポートを試みたところ、
作業用マシンと Mattermost の通信経路上にある Web サーバなどの転送サイズ制限に引っかかったため、
Docker コンテナから mattermost-bulk-import.zip ファイルに直接アクセスでるようにして、
Docker コンテナ上で mmctl コマンドを実行して直接 Mattermost にインポートしました。

```bash
docker-compose exec -i mattermost mmctl auth login http://localhost:8065
docker-compose exec mattermost mmctl import upload ./mattermost-bulk-import.zip
docker-compose exec mattermost mmctl import list available
docker-compose exec mattermost mmctl process <IMPORT FILE NAME>
docker-compose exec mattermost mmctl import job show <JOB ID> --json
```

### チャンネル名

Slack 側で使用していたチャンネル名は引き継ぐことができず、
Mattermost ではランダムな英数字列に変換されていました。
これはインポート完了後に、Web UI から一つずつ手で修正しました。

### 日本語検索

標準設定のままだと日本語での検索がうまく動きません。

システムコンソールの実験的機能にある Bleve のページを開き、
インデックス付与、検索クエリ、自動補完クエリの各機能を有効にし、
初回のみ一括インデクス付与を行う必要があります。
一括インデクス作成にはそれなりに時間がかかります。

### Incoming Webhook

他のアプリから Slack の Incoming Webhook を使って Slack のチャンネルに通知を送っていたものがあるので、
それを Mattermost の Incoming Webhook を利用するように変更しました。

Slack と異なり、
現在の Mattermost では Bot アカウントで Webhook を作成することはできません。

参考: [Using bot accounts](https://developers.mattermost.com/integrate/admin-guide/admin-bot-accounts/)
> Only user accounts can create and configure webhooks and slash commands.

Incoming Webhook を作成する際に投稿先のチャンネルを限定することは可能で、
また Incoming Webhook 経由のポストには BOT というラベルが付きます。

## 運用

### バックアップ

Mattermost はデータを次の２か所で管理します。

- ファイル<br>
    メッセージに添付されるファイルやユーザの画像ファイルなど。それぞれ単独のファイルとして保存されます。
- リレーショナルデータベース<br>
    チャットメッセージやユーザ情報などはリレーショナルデータベースに保存されます。
    Mattermost 社の提供する Docker Compose ファイルを使用する場合は PostgreSQL が使用されますが、
    MySQL を使うことも可能です。

#### ファイル
Mattermost はファイルの保存先として、
ローカルストレージと [Amazon S3](https://aws.amazon.com/jp/s3/) に対応しており、
私は後者を使用しています。
Amazon S3 は耐久性 11 9s (99.9999999%) を謳っておりバージョニングにも対応しているので、
私の用途だと別途バックアップを用意しなくても十分です。

#### リレーショナルデータベース

一方でデータベースの方は単一の VPS インスタンス上で動いているため、
VPS が置いてあるデータセンターのトラブルや、
Mattermost のソフトウェアに不具合があった場合にはデータが失われる可能性があります。

こちらは定期的にデータベースのフルダンプをとり、
Docker Compose と Mattermost の設定ファイル .env, volumes/app/mattermost/config.config.json とともに Amazon S3 にアップロードすることにしました。
シェルスクリプトを書いて cron (8) で実行しています。

なお Mattermost 社の提供する Docker Compose ファイルを使っている場合、データベースのフルダンプは次のコマンドで取得可能です。

```sh
sudo docker-compose exec postgres pg_dump -U mmuser mattermost
```

### サーバー監視

[mackerel](https://mackerel.io/)  のサーバー監視サービスを使い、
定期的に Mattermost サーバーに HTTPS リクエストを送ってサーバーの生存確認をしています。
