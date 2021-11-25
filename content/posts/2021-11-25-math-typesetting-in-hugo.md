---
title: "数式を扱う"
date: 2021-11-25T22:52:36+01:00
slug: "math-typesetting-in-hugo"
tags:
- blog
katex: true
---
数式を文章中に含めたりグラフ化する必要があったので、
使えるツールを調査。

## 数式組版

[MathJax](https://www.mathjax.org/) と [KaTeX](https://katex.org/) が広く使われている。
いずれも Javascript で書かれており、
基本的な使い方は同じ。

1. 数式を埋め込みたいドキュメントで Javascript コードを読み込む。
1. ドキュメント中に数式を `$\LaTeX$` 書式で記述しておく。
1. ドキュメント読み込み完了後に所定の関数を呼び出すと、
    ライブラリがドキュメント中の数式を探し出して組版する。

入力
: <code class="katex_ignore">$e^{i\theta} = \cos\theta + i\sin\theta$</code>

組版結果
: `$e^{i\theta} = \cos\theta + i\sin\theta$`

### 既知の問題

markdown 記法を使って文書を作成する場合、
MathJax と KaTeX いずれを使う場合でも、
アンダースコア (_) 記号の扱いが markdown記法 と `$\LaTeX$` 記法で干渉する。

入力
: <code class="katex_ignore">$\_nC\_{f(n)}$</code>

想定している組版結果
: `$_nC_{f(n)}$`

実際の組版結果
: $_nC_{f(n)}$

これは数式として組版する以前の段階で、
markdown プロセッサが _ をイタリック指定と認識して置き換え処理を行ってしまうため。
文字列が MathJax や KaTeX に渡される段階では、
すでに $\LaTeX$ 記法で下付きを意味する _ が消えてしまっている。

対策としては \`（バッククォート）を使って $\LaTeX$ 記法で書かれた数式を囲んでしまうのが簡単。
こうすると markdown プロセッサが _ を処理しなくなる
（参考: [Render LaTeX math expressions in Hugo with MathJax 3](https://geoffruddock.com/math-typesetting-in-hugo/)）。
ただし MathJax, KaTeX いずれもデフォルトでは code タグ内の文字列を無視するので、
これを処理するようにプションを指定する必要がある。

たとえば KaTeX の [Auto-render Extension](https://katex.org/docs/autorender.html) では `renderMathInElement` の `ignoredTags` で無視するタグを指定する。
デフォルト値は `["script", "noscript", "style", "textarea", "pre", "code", "option"]` で code も含まれているので、
code を除いたタグを列挙する。

```javascript
    document.addEventListener("DOMContentLoaded", function() {
        renderMathInElement(document.body, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false}
            ],
            ignoredTags: [ "script", "noscript", "style", "textarea", "pre", "option"],
            ignoredClasses: [ "katex_ignore" ],
        });
    });
```

また $ を含むインラインコードを書きたい場合には、
そのインラインコードに上記の `ignoredClasses` で指定したクラス属性を付与する。

入力
: <code class="katex_ignore">\<span class=\"katex_ignore\"\>\`$a = $b;\`\</span\></code>

出力
: <span class="katex_ignore">`$a = $b;`</span>

## [GeoGebra](https://www.geogebra.org/)

幾何、代数、表計算、グラフ、統計、解析をパッケージにしたソフトウェア。
対話的に数式を入力することでグラフ化することができ、
表示範囲や色なども簡単に設定できる。

$$ f(r) = (1 + r)\frac{1 - (1+r)^{-N}}{r} $$

横軸を $r$、縦軸を $f(r)$ として $N = 10, 11, 12, 13, 14, 15$ の場合のグラフを描画。
この程度なら数分で作成可能。

{{< image
    path="2021/11/math/PVIFA.png"
    caption="年金現価係数" >}}
