---
title: "Gompertz Makeham Law of Mortality 下での平均余命"
date: 2022-08-28T18:13:30+02:00
katex: true
slug: "gempertz-makeham-law"
tags:
- リタイアメントプランニング
---
最近、
年金・生命保険の金融モデルについて解説した The Calculus of Retirement Income という書籍をゆるゆると読み進めています。

{{< amazon
    title="The Calculus of Retirement Income"
    author="Moshe Arye Milevsky"
    publischer="Cambridge University Press"
    asin="0521842581"
    isbn="978-0521842587"
>}}

使っている数学はさほど難しくないのですが、
たまに式の導出を端折ってあり、
自分で導出するのに時間を使うことがあります。
個人的に式 (3.27) の導出に少し苦労したので、
覚え書き。

なお導出に必要かと思い不完全ガンマ関数について少し勉強しましたが、
最終的には不完全ガンマ関数に関する定理を使う必要はなく、
単なる置換積分で十分でした。
最近は数学を使う機会があまりないので、
腕が鈍ってますね。

## 前提
現在 $x$ 歳の人が $t$ 年後に生存している確率を $({}_tp_x)$ とし、
IFM (Instantaneous Force of Mortality) $\lambda(x)$ を次のように定義する。

<div>
$$ ({}_t p_x) =  \exp{\left\{- \int_{x}^{x+t} \lambda(s)\ ds \right\}} $$
</div>

現実を比較的良く表すことができるモデルとして、
次の式で与えられる Gompertz-Makeham Law of Mortality がある。

<div>
$$ \lambda(x) = \lambda + \frac{1}{b}e^{(x-m)/b} $$
</div>

第一項は年齢によらず一定の確率で起こる事故による死亡、
第二項は加齢に伴い増える病気・老化による死亡に対応する。

## 問題

Gompertz-Makeham Law of Mortality 下で、
現在 $x$ 歳の人の平均余命 $E[T_x]$ を求める。

まず定義に従って $t$ 年後生存確率 $({}_tp_x)$ を計算する。

<div>
$$
\begin{align*}
({}_t p_x) &= \exp{\left\{- \int_{x}^{x+t} \lambda(s)\ ds \right\}} \\
&= \exp{\left\{- \int_{x}^{x+t} \lambda + \frac{1}{b}e^{(s-m)/b}\ ds \right\}} \\
&= \exp{\left\{-\left[ \lambda s + e^{(s-m)/b} \right]_{x}^{x+t} \right\}} \\
&= \exp{\left\{ -\left[\lambda(x+t) - \lambda x + e^{(x+t-m)/b} - e^{(x-m)/b}  \right] \right\}} \\
&= \exp{\left\{ -\left[ \lambda t + e^{(x-m)/b}(e^{t/b} - 1) \right] \right\}} \\
&= \exp{\left\{ -\lambda t + b(\lambda(x) - \lambda)(1 - e^{t/b}) \right\}}
\end{align*}
$$
</div>

これを $E[T_x] = \int_0^{\infty} ({}_tp_x)\ dt$ に代入する。

<div>
$$
\begin{align*}
E[T_x] & = \int_0^{\infty} ({}_tp_x) \ dt \\
&= \int_0^{\infty} \exp{\left\{ -\lambda t + b(\lambda(x) - \lambda)(1 - e^{t/b}) \right\}}\ dt
\end{align*}
$$
</div>

ここで $e^{t/b} = u$ とおくと、
積分変数は次のように置換され、
積分区間は $t: 0 \rightarrow \infty$ に対して $u: 1 \rightarrow \infty$ になる。
<div>
$$
\begin{align*}
\frac{1}{b} e^{t/b} dt &= du \\
\frac{1}{b} u\ dt &= du \\
dt &= b u^{-1} du
\end{align*}
$$
</div>

また $e^{t/b} = u$ の両辺の対数を取ると $t$ を $u$ で表すことができる。
<div>
$$
\begin{align*}
\frac{t}{b} &= \ln u \\
t &= b\ln u
\end{align*}
$$
</div>

以上を使って $E[T_x]$ から変数 $t$ を消去する。
記述を簡略化するため、定数 $c = b(\lambda(x) - \lambda)$ とおく。

<div>
$$
\begin{align*}
E[T_x] &= \int_0^{\infty} \exp{\left\{ -\lambda t + b(\lambda(x) - \lambda)(1 - e^{t/b}) \right\}}\ dt \\
&= \int_1^{\infty} \exp\{-\lambda b \ln u + c(1-u)\}\ bu^{-1}\ du \\
&= \int_1^{\infty} \exp(-\lambda b \ln u)e^c e^{-cu} bu^{-1}\ du \\
&= b e^c\int_1^{\infty} u^{-\lambda b} e^{-cu} u^{-1}\ du \\
&= b e^c\int_1^{\infty} e^{-cu} u^{-\lambda b - 1}\ du
\end{align*}
$$
</div>

再度 $cu = s$ と置換する。$u = c^{-1} s$, $du = c^{-1} ds$, また積分区間は $s: c \rightarrow \infty$ となるから、

<div>
$$
\begin{align*}
E[T_x] &= be^c \int_{c}^{\infty} e^{-s} (c^{-1} s)^{-\lambda b - 1} c^{-1}\ ds \\
&= be^c \int_{c}^{\infty} e^{-s} c^{\lambda b + 1} s^{-\lambda b - 1} c^{-1}\ ds \\
&= be^c c^{\lambda b} \int_c^\infty e^{-s} s^{-\lambda b - 1}\ ds
\end{align*}
$$
</div>

$c = b(\lambda(x) - \lambda) $ とおいたが、
このうち $\lambda(x) - \lambda$ は Gompertz-Makeham Law of Mortality のうち年齢依存部分 $\frac{1}{b}e^{(x-m)/b}$ に相当する。

<div>
$$
c = b \times \frac{1}{b} e^{(x-m)/b} = e^{(x-m)/b} \\
c^{\lambda b} = \left(e^{(x-m)/b}\right)^{\lambda b} = e^{(x-m)\lambda}
$$
</div>

また $E[T_x]$ の積分項は、
不完全ガンマ関数 $\Gamma(a,x) = \int_x^\infty t^{a-1} e^{-t}\ dt$ を用いて次のように記述できる。

<div>
$$
\int_c^\infty e^{-s} s^{-\lambda b - 1}\ ds = \Gamma(-\lambda b,c)
$$
</div>

以上より (3.27) が導出される。
<div>
$$
\begin{align*}
E[T_x] &= be^c c^{\lambda b} \int_c^\infty e^{-s} s^{-\lambda b - 1}\ ds \\
&= be^{b(\lambda(x) - \lambda)}e^{(x-m)\lambda} \Gamma(-\lambda b, \lambda(x) - \lambda) \\
&= \frac{b \Gamma(-\lambda b, b(\lambda(x) - \lambda))}{e^{(m-x)\lambda + b(\lambda - \lambda(x))}}
\end{align*}
$$
</div>
