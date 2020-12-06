---
aliases:
- /2020/08/24/apps_script_for_billing.html
date: 2020-08-24 17:45:41 +0200
slug: apps_script_for_billing
tags:
- プログラミング
title: Google スプレッドシートで請求書作成
---
私の子供は週に一度、
日本語を学ぶための日本語学校に通っています。
義務教育ではないので、学校運営に関わる費用は保護者負担で、
半期ごとに日本語学校から保護者に請求書を送っています。

我が家ではこの請求書作成を手伝っているのですが、
件数も増えたたため手作業で一枚ずつ請求書を作るのは非現実的なので、
Google スプレッドシートと Apps Script を使って請求書発行システムを作りました。
スプレッドシートに所定の形式で保護者と児童の情報を入力すると、
各家庭に対して一枚ずつ PDF 形式で請求書を書き出します。

さほど複雑な内容ではないので仕様書を作るほどではありませんが、
さすがに何もないと忘れそうなので記録に残しておきます。
あと Apps Script を使い始める上での取っ掛かりの知識と、
いくつか部分的に再利用できそうなコードの断片を残しておきます。

いわゆる業務系アプリケーションになるので、
プログラミング自体は全く難しくないです。
ただしデータの入力から入金確認まで一連の業務を想定してデータの仕様を決め、
ユーザにやってもらう処理・プログラム的に行う処理の切り分けを行わないと、
あとで運用できずに破綻しがち。
私は以前 BPR の IT コンサルをやってたことがあるので、
この手の業務・システム設計はお手のもの。

## 要求仕様

* 請求書は児童単位ではなく、家族単位で発行する。一部請求項目が家族単位のため。
* 請求金額は次の合計。
    * 会費　（家族単位）
    * 授業料　（児童単位）
    * 教材費　（児童単位）
    * 日本語検定試験対策授業料　（児童単位）

| 費目 | 単位 | 金額の決まり方 | 備考 |
| - | - | - | - |
| 会費 | 家族 | 会員種別 | その家庭が学校運営に関わる場合には減額 |
| 授業料 | 児童 | 一律 |
| 教材費 | 児童 | 学年毎 | 例：幼稚園クラスは無料、小学校クラスは20フランなど<br>上期には請求するが下期は請求しない |
| 日本語検定試験対策授業料 | 児童 | 一律 | 受講を希望する児童にのみ請求 |

他にも出力するファイル名などの細かい仕様がいくつかありましたが、
それらはスプレッドシートでマクロを使って自動生成して特定のセルに書いてもらうようにして、
Apps Script にはロジックを持ち込まないようにしました。

## データ構造

| シート名 |  内容 | 備考 |
| - | - | - |
| T_保護者 | 保護者の情報 | 家庭ごとに1行 |
| T_児童 | 児童の情報 | 児童ごとに1行<br>保護者1エントリに対して複数の児童が対応 |
| 請求書作成データ | 全請求書共通のデータ | 今季の授業料の金額など |

### 運用

* 保護者・児童とも入校前に名簿に登録し、退校後も一定期間は削除しない。
* 児童の在籍学年は個別に設定可能とする。原則として日本の学年と合わせるが、進度に応じて留年などの措置もあり得るため。
* 出力される請求書は、請求書発行を行う日時に依存しないようにする。
    * 発行日時を基準に「○○年度第一期分請求書」などと自動的に計算すると、事前の請求書発行テスト、実際の発行、（トラブルがあったときの）請求書再発行で内容が変わってしまう。
* 発行した請求書は PDF 形式で残しておく。
* 次期の請求書発行業務を始めたら、前期の請求書は再発行できなくなっても構わない。

## プログラム

請求書発行プログラムは、
Google スプレッドシートの Apps Script として作りました。
実行すると次のようにして請求書を作成します。

1. スプレッドシートから情報を読み込む
1. 家族単位で集計し、出力する項目、金額と合計額を求める。
1. Goodle ドキュメントで作成したテンプレートをコピーし、上で求めた値を使って可変部分を置き換える。
1. Google ドキュメントから PDF に変換。

### スクリプトを書き始める

メニューから［ツール］→［スクリプトエディタ］を選択すると、
スクリプトエディタが開きます。

### スクリプトの実行方法

スクリプトエディタから直接関数を選択して実行することもできますが、
スプレッドシートのメニューに追加しておくと、
あとで他の人に実行してもらう際に便利です。

```javascript
var ui = SpreadsheetApp.getUi();

function onOpen() {
  ui
  .createMenu('請求書')
  .addItem('作成' + 'createBills')
  .addToUi();
}

function createBills() {
    // 請求書作成のコード
}    
```

### デバッグ方法

みんな大好き printf デバッグ。
[Stackdriver Logging](https://developers.google.com/apps-script/guides/logging) が使えます。

```javascript
console.info('保護者テーブルの処理開始');
```
こんな感じでスクリプト中にログメッセージを出力するコードを埋めておくと、
Apps Script ダッシュボードでメッセージを見ることができます。

またコードの一部を `console.time`, `console.timeEnd` で囲むと、
その間の処理にかかった時間が出力されます。

**ログ出力例**

![ログ出力例](/assets/2020/08/24/log_on_dashboard.png)

### データの読み取りの高速化


`Sheet.getRange` API は遅いので、
スプレッドシートのセルを読み取る際に呼び出し回数をなるべく減らします。

最初 [`Sheet.getRange(row, column)`](https://developers.google.com/apps-script/reference/spreadsheet/sheet#getrangerow,-column) を使って
保護者の情報をシートから1行ずつ読み取っていたのですが、
これだと呼び出しの度にスプレッドシートとの通信が発生するため、
保護者数が増えると実行時間が比例して伸びていきます。

```javascript
var ss = SpreadsheetApp.getActiveSpreadsheet();
var s = ss.getSheetByName('T_保護者');

var lastRow = s.getLastRow();

for (var i = 1; i < s.getLastColumn(); ++i) {
    var range = s.getRange(i, lastColumn);
    var values = range.getValues();

    // 1家族分の情報（一行分のデータ）が values に入ってくる
    // values を使って請求書を作成
}
```

代わりに [`getRange(row, column, numRows, numColumns)`](https://developers.google.com/apps-script/reference/spreadsheet/sheet#getrangerow,-column,-numrows,-numcolumns) で複数行を一度に読み込み、
そうして得られた [`Range`](https://developers.google.com/apps-script/reference/spreadsheet/range) オブジェクトを走査すると、
スプレッドシートとの通信は1度で済むので、
データ数が増えても処理時間が変わりません。

```javascript
var ss = SpreadsheetApp.getActiveSpreadsheet();
var s = ss.getSheetByName('T_保護者');

var lastColumn = s.getLastColumn();
var lastRow = s.getLastRow();

// header に1行目（見出し）の情報を読み込む
var header = s.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]

// body に2行目以降の情報を読み込む
var body = s.getRange(2, 1, lastRow - 1, lastColumn);

for (var i = 1; body.getNumRows(); ++i) {
    var values = bodyValues[i];
    // 1家族分の情報（一行分のデータ）が values に入ってくる
    // values を使って請求書を作成
}
```

### テンプレートから一部文字列を置き換えた Google ドキュメントを作成

Goodle ドキュメントで作っておいたテンプレートファイルを読み込み、
その中に埋め込んだ特定の文字列を置き換えたファイルを作ります。

```javascript
var templateId = 'xxx'; // Google ドキュメントで作成したテンプレートファイルのID
var copyFile = DriveApp.getFileById(templateId).makeCopy(),
    copyId = copyFile.getId(),
    copyDoc = DocumentApp.openById(copyId),
    copyBody = copyDoc.getActiveSection();

// テンプレート中の '%保護者ID%' という文字列を 3 に置き換える。
copyBody.replaceText('%保護者ID%', '3');

copyDoc.saveAndClose()
copyFile.setName('出力ファイル名');
```

Google ドキュメントのIDは、
Google ドキュメントを開いたときの URL に含まれる60文字程度のランダムな英数字です。

**例**

* URL<br>
`https://docs.google.com/document/d/1RjQCF3Vkp7q9VsGUvO5wyglwb9zSKDtarecJMCJrGQo/edit`
* ID<br>
`1RjQCF3Vkp7q9VsGUvO5wyglwb9zSKDtarecJMCJrGQo`

### Google ドキュメント中のテーブルに項目を追加

前述の方法はテンプレート中に含まれる項目を置き換えるだけなので、
場合によっては出力したくないなど項目数が可変となる場合には対応できません。
この場合にはテーブルを使うと便利です。

下記のコードでは、ドキュメントの最初に出てくるテーブルに「見出し」「値」の2項目からなる行を追加しています。

```javascript
// ドキュメント中の最初のテーブルを取得
// copyBody は前項参照
var tables = copyBody.getTables();
table = tables[0];
// 1行追加
appendLine(table, '第二期授業料', '32.5');

/**
 * 表に請求項目を一行追加する
 *
 * table 追加先のテーブル
 * item  請求費目（例: "Schulgebühr 2. Semester 2018/2019, John Smith")
 * cost  請求金額（例: 32.5）
 * bold  行を太字にするか
 */
function appendLine(table, item, cost, bold) {
  var styleItem = {};
  styleItem[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] =
      DocumentApp.HorizontalAlignment.LEFT;
  styleItem[DocumentApp.Attribute.ITALIC] = false;
  styleItem[DocumentApp.Attribute.BOLD] = bold;

  var styleCost = {};
  styleCost[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT]
      = DocumentApp.HorizontalAlignment.RIGHT;
  styleCost[DocumentApp.Attribute.ITALIC] = false;
  styleItem[DocumentApp.Attribute.BOLD] = bold;

  var tr = table.appendTableRow();
  tr.appendTableCell().setText(item).getChild(0).setAttributes(styleItem);
  tr.appendTableCell().setText(cost).getChild(0).setAttributes(styleCost);
}
```

### Google ドキュメントから PDF ファイルを作成
最後に作成した Google ドキュメントから PDF ファイルを作成します。
Google ドキュメントは標準で PDF 形式でのエクスポートに対応しているので、
基本的にはそれを使うだけです。

下記では、
作成した Google ドキュメントと同じディレクトリに指定のファイル名で PDF ファイルを作成するため、
テンプレートファイルをコピーするときに取得した `File` オブジェクトから [`getParents()`](https://developers.google.com/apps-script/reference/drive/file#getParents()) API を使ってディレクトリを取得しています。

`DriveApp` クラス経由で直接 `createFile` を呼び出すと（folder == null のケース）、
Goodle ドライブのトップディレクトリに PDF ファイルが作成されます。


```javascript
// copyId, copyFile は前項参照
var outFolder = copyFile.getParents().hasNext() ? copyFile.getParents().next() : null
writePDF(copyId, '請求書.pdf', outFolder);

/**
 * Google Docs のドキュメントを PDF 形式で出力する
 */
function writePDF(docId, filename, folder) {
  var url =
      'https://docs.google.com/feeds/download/documents/export/Export?id='
      + docId + '&exportFormat=pdf'
  var options = {
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  }
  var doc = UrlFetchApp.fetch(url, options).getBlob()
  if (folder == null) {
    DriveApp.createFile(doc).setName(filename)
  } else {
    folder.createFile(doc).setName(filename)
  }
}
```

### Apps Script の制限

Apps Script を実行する上で、
いくつか制限が設定されています。

詳細は [Quotas for Google Services](https://developers.google.com/apps-script/guides/services/quotas) にありますが、
通常の gmail.com アカウントで実行していて抵触したのは次の２つ。

* スクリプトの連続実行時間は6分まで。
* Google ドキュメントを新規作成できるのは250件/日まで。

Google ドキュメントで作ったテンプレートをコピーして文字列を置換したり PDF ファイルを作成するのは数秒単位で時間がかかるので、
出力する請求書が数十枚程度になった時点で最初の制限に抵触します。

私の場合はスプレッドシートからデータを読み込む部分はさほど時間がかからなかったので、
とりあえずデータはすべて読み込むけれど、
出力は分割することで対処しました。
具体的には実行時にダイアログを表示して、
処理対象の保護者IDの範囲を指定できるようにして、
その範囲の保護者のみ処理対象としました。
