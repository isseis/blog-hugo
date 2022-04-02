---
title: "無料版 Gmail で独自ドメインを使ってメールを送信する際に DKIM 署名を付ける"
date: 2022-04-02T13:30:01+02:00
slug: "dkim-in-gmail"
tags:
- プログラミング
---
独自ドメインを使って Google のサービスを利用する場合 [Google Domains](https://domains.google/) + [Google Workspace](https://workspace.google.com/products/gmail/index.html) を契約するのが王道ですが、
個人で使う程度であれば Google Domains と無料版の Gmail の組み合わせでも利用可能です [^1]。

[^1]: Google Workspace を契約すると、独自ドメインのアカウントがグーグルの各種サービス (Google Play や YouTube など) を使う際の正式なアカウントとなります。この場合、利用できるサービスが @gmail.com のアカウントと一部異なるため、個人のメインアカウントとして使うにはやや不便です。

- [Google Domains ヘルプ: メールを転送する](https://support.google.com/domains/answer/3251241)
- [Google ヘルプ: 別のアドレスやエイリアスからメールを送信する](https://support.google.com/mail/answer/22370)

この設定でメールを送受信できるようになりますが、
メールに送信元のなりすましや主要フィールドの改ざんが行われていないことを保証するための [DKIM](https://www.nic.ad.jp/ja/basics/terms/dkim.html) 署名を付与することができません。

DKIM に対応したメールシステムが普及してきたことに伴い DKIM 署名がないメールは迷惑メールと判断される可能性が高くなってきたので、
別途契約している VPS （仮想専用サーバー）を使って DKIM 署名と [DMARC](https://www.nic.ad.jp/ja/basics/terms/dmarc.html) の設定を行いました。その忘備録。

今回は自分でメールサーバーを用意しましたが、
システム管理が趣味（もしくは仕事）という人以外は [VPS を使わずに実現する方法](#vps-を使わずに実現する方法) を検討する方が良いと思います。

## 構成

Gmail で独自ドメインのメールアドレスを差出人としてメールを送信する場合、
次の２つの方法を選択できます。

1. Gmail のサーバーから直接相手のメールサーバーに送信する。
1. Gmail のサーバーから自分の組織で管理しているメールサーバーに送り、そこから相手のメールサーバーに送信する。

これまでは前者を使ってきましたが、
これだと `@gmail.com` のメールアドレスを使う場合を除いて DKIM 署名をつけることができません。
送信方法を後者に変更し、
自身で管理しているメールサーバで DKIM 署名を行うことにします。

### 前提

インターネット上からアクセス可能な仮想専用サーバー (VPS) があり、
そこには次の環境が設定済みとします。

- Ubuntu 20.04
- [Docker](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### SPF の設定

使用する仮想専用サーバーのアドレスを DNS サーバーの SPF レコードに登録します。

参考:
- [SPF (Sender Policy Framework) とは](https://www.nic.ad.jp/ja/basics/terms/spf.html) (JPNIC)
- [SPF レコードを定義する: 基本設定](https://support.google.com/a/answer/10685031) (Google Domains)


### DKIM 鍵の生成

DKIM 署名に必要となる鍵を生成するため、
まず仮想専用サーバーに [OpenDKIM](http://www.opendkim.org/) をインストールします。
```bash
sudo apt-get install opendkim opendkim-tools
```

次にインストールした OpenDKIM のコマンドラインツールを使って、
署名ならびに、
その検証に必要となる秘密鍵・公開鍵のペアを作成します。

```bash
opendkim-genkey -b 2048 -d ${DOMAIN_NAME} -s ${SELECTOR} -v
```

`${DOMAIN_NAME}` は利用する独自ドメイン名、
`${SELECTOR}` は適当な文字列を設定します。
これでカレントディレクトリに

- 秘密鍵を格納した `${SELECTOR}.private`
- 公開鍵を格納した `${SELECTOR}.txt`

という２つのファイルができます。
DNS サーバーとして BIND を使用している場合、
`${SELECTOR}.txt` はそのままゾーンファイルに追加できる書式になっています。

公開鍵を独自ドメインを管理している DNS サーバーに登録し、
秘密鍵は `/etc/opendkim/keys/${DOMAIN_NAME}` というディレクトリを作成してコピーし、
root ユーザー以外は読み込めないように権限を設定しておきます。

```bash
chown root:root /etc/opendkim/keys/DOMAIN_NAME/${SELECTOR}.private
chmod 600 /etc/opendkim/keys/${DOMAIN_NAME}/${SELECTOR}.private
```

### SSL 証明書の入手

仮想専用サーバーとの通信を暗号化するために SSL 証明書が必要になるため、
[Let's encrypt](https://letsencrypt.org/) に発行を依頼します。

VPS サーバーにログインし [certbot instructions (Other on Ubuntu 20)](https://certbot.eff.org/instructions?ws=other&os=ubuntufocal) の手順に従って作業を行うと、
自動的に仮想専用サーバー上で HTTP サーバーが起動し、
Let's encrypt 側から指定したホスト名を使ってアクセスできるか確認されます。
アクセス可能であれば、
ドメイン所有権の確認が完了したものとして即座に SSL 証明書が発行され、
`/etc/letsencrypt/live/${DOMAIN_NAME}` ディレクトリに秘密鍵と公開鍵を格納したファイルが作成されます。

なお仮想専用サーバーに複数の名前を割り当てている場合（`www.example.com` と `mail.example.com` など）
使用する可能性がある名前すべてを `-d` オプションで指定する必要があります。

例
```bash
sudo certbot certonly -d ${VPS_NAME_1} -d ${VPS_NAME_2} --standalone
```

証明書の有効期限は９０日ですが、
自動的に更新されます。
この自動更新の手続きがあるため、
作成された秘密鍵・公開鍵を格納したファイルを別の場所にコピーしたり名前を変更することなく、
オリジナルのパス名で参照する必要があります。

### Postfix の導入

これで事前準備が整ったので、
いよいよ DKIM 署名を行う MTA として [Postfix](https://www.postfix.org/) を導入・設定します。
保守を容易にするために [Docker イメージ](https://github.com/panubo/docker-postfix) を使います。

#### IPv4 を使う場合

`docker-compose-ipv4.yml`
```yml
version: '2.1'

services:
  smtp:
    image: panubo/postfix:latest
    container_name: smtp
    hostname: smtp-server
    environment:
      - MAILNAME=${HOST_FQDN}
      - MYNETWORKS=127.0.0.0/8
      - TZ=Asia/Toyo
      - SMTPD_USERS=${SMTPD_USERS}
      - USE_DKIM=yes
      - DKIM_KEYFILE=/etc/opendkim/keys/${DKIM_DOMAINS}/${DKIM_SELECTOR}.private
      - DKIM_DOMAINS=${DKIM_DOMAINS}
      - DKIM_SELECTOR=${DKIM_SELECTOR}
      - DKIM_SIGN_HEADERS=MIME-Version,Content-Type,Content-Transfer-Encoding,Date,Message-Id,Subject,From,Sender,To,Cc,Reply-To,Resent-Date,Resent-From,Resent-To,Resent-Cc,In-Reply-To,References
      - USE_TLS=yes
      - TLS_KEY=/etc/letsencrypt/live/${HOST_FQDN}/privkey.pem
      - TLS_CRT=/etc/letsencrypt/live/${HOST_FQDN}/fullchain.pem
      - POSTCONF=mydestination =;local_transport = error:local mail delivery is disabled;smtpd_tls_security_level = encrypt;smtpd_tls_received_header = yes
    expose:
       - '587'
    volumes:
      - /etc/opendkim:/etc/opendkim
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - 587:587/tcp
    logging:
      options:
        max-size: '10m'
        max-file: '3'
    restart: always
```

`${XXX}` の部分は `.env` ファイルを作成し適切な内容を記述しておきます。

| 名前 | 内容 |
| - | - |
| `DKIM_DOMAINS` | メールアドレスの一部として使用するドメイン名 |
| `DKIM_SELECTOR` | DKIM の鍵を作成する際に指定したセレクタ名 |
| `HOST_FQDN` | 仮想専用サーバーのホスト名 (FQDN) |
| `SMTPD_USERS` | Gmail からメールを送信する際の認証に使用するユーザー名とパスワード |

`SMTPD_USERS` は SMTP 認証で使うユーザー名とパスワードをコロン (:) で区切ったものです。
複数のユーザー名/パスワードの組を使用する場合にはカンマ (,) で繋げます。

例
```text
SMTPD_USERS=USER1:PASSWORD1,USER2:PASSWORD2
```


設定項目の詳細は [Docker イメージの README.md](https://github.com/panubo/docker-postfix#environment-variables) ならびに [postconf (5)](https://www.postfix.org/postconf.5) を参照してください。
今回、
Postfix は Gmail から送信したメールを受け取り DKIM 署名をつけた上でリレーするためだけに使うので、

- ローカル宛のメールは受け取らない
- Postfix に接続する際には TLS（暗号化）の使用を必須とする

など、あまり一般的ではない設定になっています。


#### IPv6 を使う場合

なお IPv6 を使う現実的なメリットは、ほぼゼロです [^2]。
Docker や Gmail などの IPv6 対応状況を知りたかったので試しに設定してみました。

[^2]: オープンリレーサーバーや迷惑メール送信元を登録したブラックリストが公開されていますが、
  ときどき ISP のアドレスがブロック単位で登録されて巻き込まれることがあります。
  IPv6 を使って迷惑行為を行っているケースは少ないので、
  こういうトラブルに合う可能性はやや少なくなります。

Docker コンテナ側にグローバル IPv6 アドレスを割り当てる方法と、
IPv4 の場合と同様にプライベートアドレスを割り当てて NAT する方法がありますが、
今回は後者を使います。

まず Docker デーモンで IPv6 を有効にしておき、
Docker コンテナ側で使用する IPv6 アドレスの範囲を追加しておきます。
ファイル作成後には Docker デーモンの再起動が必要です。

`/etc/docker/daemon.json`
```json
{
        "ipv6": true,
        "fixed-cidr-v6": "fd00::/64"
}
```

Docker 用の設定ファイルは基本的には IPv4 を使用する場合と同じですが、
IPv6 ネットワークを使用するためにいくつか追加項目があります。
docker-compose の [exetends](https://docs.docker.com/compose/extends/#extending-services) キーワードを使って IPv4 用の設定ファイルを再利用し、
必要な差分だけ記述した `docker-compose-ipv6.yml` ファイルを作成します。

`docker-compose-ipv6.yml`

```yml
version: '2.1'

services:
  ipv6nat:
    image: robbertkl/ipv6nat
    container_name: ipv6nat
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    network_mode: 'host'
    restart: unless-stopped

  smtp:
    extends:
      file: docker-compose-ipv4.yml
      service: smtp
    depends_on:
      - ipv6nat
    environment:
      - MYNETWORKS=127.0.0.0/8,[fe80::]/10
      - POSTCONF=mydestination =;local_transport = error:local mail delivery is disabled;smtpd_tls_security_level = encrypt;smtpd_tls_received_header = yes;smtp_address_preference = ipv6
networks:
  default:
    driver: bridge
    enable_ipv6: true
    ipam:
      config:
        - subnet: 172.24.0.0/24
          gateway: 172.24.0.1
        - subnet: fd00:1::/80
          gateway: fd00:1::1
```

### Docker 操作

#### 事前準備
IPv4, IPv6 いずれかのファイルを `docker-compose.yml` というファイル名でアクセス可能にしておきます。

```bash
ln -s docker-compose-ipv6.yml docker-compose.yml
```

#### 起動
```bash
sudo docker-compose up -d
```

#### 終了
```bash
sudo docker-compose down
```

#### ログ表示
```bash
sudo docker-compose logs -f
```

### Postfix 動作確認

もし IP パケットフィルタを設定している場合には、
TCP 587 番ポートへのアクセスを許可しておきます。
設定方法は様々ですが、
たとえば ufw を使っている場合。

```bash
sudo ufw allow 587/tcp
```

`s-nail` コマンドを使って Postfix 経由でメールを送信し、
設定した Postfix が正しく動作するかを確認します。

インストール
```bash
sudo apt-get install s-nail
```

メール送信
```bash
echo -e "To: $MAIL_ADDRESS\n\
From: $MAIL_ADDRESS\n\
Subject: Test email\n\
\n\
This is a test email message (TLS + SMTPAUTH)" | \
s-nail -v \
-S v15-compat \
-S smtp-use-starttls \
-S tls-verify=ignore \
-S mta=smtp://$SMTP_AUTH_USER:$SMTP_AUTH_PASS@localhost:587 \
-S smtp-auth=login \
-S from=$MAIL_ADDRESS -t
```

| 変数 | 内容 |
| - | - |
| MAIL_ADDRESS | 独自ドメインを含むメールアドレス。 |
| SMTP_AUTH_USER | Postfix に接続する際に使用するユーザー名。docker-compose.yml で指定したもの。|
| SMTP_AUTH_PASSWORD | Postfix に接続する際に使用する使用するパスワード。docker-compose.yml で指定したもの。 |


Gmail でメールを受信できたら [Gmail ヘルプ: 完全なヘッダーからメールの経路を確認する](https://support.google.com/mail/answer/29436) に従ってヘッダ情報を確認します。
DKIM: 'Pass' という表示があれば DKIM 署名は成功しています。

### Gmail の設定

最後に Gmail からメールを送る際の設定を更新し、
仮想専用サーバーを経由するように変更します。

- [Google ヘルプ: 別のアドレスやエイリアスからメールを送信する](https://support.google.com/mail/answer/22370)

今回の設定だと SMTP サーバーとして仮想専用サーバー、
接続には TLS 587 番ポートを使うことになります。

### DMARC の設定

[DMARC](https://www.nic.ad.jp/ja/basics/terms/dmarc.html) の設定をして、
認証に失敗しているメールがないかをモニタリングします。
しばらく運用して問題ないようであれば、
認証失敗時にはメールを破棄するようにポリシーを設定して公開します。

DMARC を設定すると、
メールを受信するメールサーバーから定期的にレポートが送られてくるようになります。
レポートは機械的に処理することを想定したフォーマットになっており人間がそのまま読むのは辛いので、
[dmarcian](https://dmarcian.com/) や [EasyDMARC](https://easydmarc.com/) といった解析サービスを利用するのが便利です。
個人で使う程度のメールの量であれば、
たいてい無料プランで対応可能です。

### その後

一通り動くようになった後の作業。

- メールサーバーを監視し、
  トラブル時に通知を受け取れるようにする。
- 設定ファイルのバックアップを作成し、
  サーバーの再構築が必要な場合に即座に対応できるようにする。

仮想専用サーバーを提供する企業のサービスに簡単なサーバー監視サービスが含まれていたので、
それを使って定期的に TCP 587 番ポートに定期アクセスして生存確認、
失敗時には Slack に通知を飛ばすようにしました。

設定ファイルは Git リポジトリに登録し、
GitHub 上に作成したプライベートリポジトリに push してあります。
なおパスワードなどが含まれるファイルは [git-crypt](https://github.com/AGWA/git-crypt) で暗号化するようにしました。

## 受信したメールの認証

今回の設定で独自ドメインを使ったメールの送信は問題がなくなりますが、
受信に関しては一つ問題が残ります。

受信したメールが正当な送信者から送られたものか差出人を騙っているのかを判断する方法の一つとして、
メールの差出人 (Envelope-From) と接続相手の IP アドレスを照合する SPF 認証がありますが、
今回の構成だと Google Domains による転送処理が入るために SPF 認証は失敗します。

参考: [宛先アドレスの変更検出によるSPF転送問題解決手法](https://www.ieice.org/ken/paper/20090305zaKg/) 2. SPFと転送メール問題

ただし転送されたメールのヘッダを見てみると、
最初に Google のサーバーでメールを受信したときの認証結果を電子署名付きで記録してあるので、
Gmail で最終的な迷惑メール判定を行う際にはこちらを参照することで問題を回避しているのかもしれません。

以下に転送されたメールのヘッダを一部抜粋します。
最終的な `Authentication-Results` では `spf=softfail` となっていますが、
転送前の結果が `X-Original-Authentication-Results` と `ARC-Authentication-Results` に記録されており、
そこでは `spf=pass` となっています。

```
Authentication-Results: mx.google.com;
       arc=pass (i=1 spf=pass spfdomain=****.**** dmarc=pass fromdomain=****.****);
       spf=softfail (google.com: domain of transitioning ****@****.**** does not designate ***.***.***.*** as permitted sender) smtp.mailfrom=****@****.****;
       dmarc=fail (p=NONE sp=NONE dis=NONE arc=pass) header.from=****.****
X-Original-Authentication-Results: gmr-mx.google.com;
       spf=pass (google.com: domain of ****@****.**** designates ***.***.***.*** as permitted sender)
ARC-Authentication-Results: i=1; gmr-mx.google.com;
       spf=pass (google.com: domain of ****@****.**** designates ***.***.***.*** as permitted sender) smtp.mailfrom=****@****.****;
       dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=****.****
```

参考
- [Authenticated Received Chain (ARC)](https://en.wikipedia.org/wiki/Authenticated_Received_Chain)

## VPS を使わずに実現する方法

独自ドメインのメールアドレスを使いつつ DKIM 署名を行うために最も簡単な方法は、
[Google Workspace](https://workspace.google.com/) や [Microsoft 365](https://www.office.com/) など独自ドメインの利用を前提としたサービスを契約することです。
この場合はメールの送受信には無料版の Gmail ではなく、
契約したサービスのメール環境を利用することになります。

また、メールの送信サービスを利用することも可能です。
本来、サービス提供会社が想定しているのは

- マーケティング用にメールの一斉送信を行う。
- オンライン店舗が顧客向けに購入・発送などの通知メールを送ること。

ですが、
事業者によっては今回のような用途でも利用を許可する場合があります。

何社かオンラインサインアップして試してみたところ [Outbound SMTP](https://www.outboundsmtp.com/) は利用可能、
[mailersend](https://www.mailersend) と [Amazon SES](https://docs.aws.amazon.com/ja_jp/ses/latest/dg/Welcome.html) は事業者向けということで個人利用はお断りでした。
