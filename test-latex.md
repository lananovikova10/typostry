# LaTeX Math Rendering Test

## Inline Math

The equation $a^{2}+b^{2}=c^{2}$ is a variation of the Pythagorean theorem.

Here's another inline example: $x_{i}^{2}$ with subscript and superscript.

Simple inline: $a+b$ for addition.

## Block Math (Display Mode)

Using double dollar signs:

$$E = mc^2$$

Another block equation:

$$\int_{a}^{b} x^2 \, dx = \frac{b^3}{3} - \frac{a^3}{3}$$

## Basic Syntax

### Fractions

Inline fraction: $\frac{1}{2}$ is one half.

Block fraction:

$$\frac{numerator}{denominator}$$

### Subscripts and Superscripts

- Subscript: $x_i$
- Superscript: $x^2$
- Combined: $x_{i}^{2}$

## Common Mathematical Structures

### Summation

Inline: $\sum_{k=1}^{N} k^2$

Block:

$$\sum_{k=1}^{N} k^2$$

### Product

Inline: $\prod_{i=1}^{n} x_i$

Block:

$$\prod_{i=1}^{n} x_i$$

### Integral

Inline: $\int_{0}^{\infty} e^{-x} dx$

Block:

$$\int_{0}^{\infty} e^{-x} dx$$

### Limit

Inline: $\lim_{n \to \infty} \frac{1}{n}$

Block:

$$\lim_{n \to \infty} \frac{1}{n}$$

## Greek Letters

- Alpha: $\alpha$
- Beta: $\beta$
- Pi: $\pi$
- Omega: $\omega$
- Theta: $\theta$
- Sigma: $\sigma$
- Delta: $\Delta$

## Brackets

Auto-sizing brackets: $\left( \frac{a}{b} \right)$

Larger example:

$$\left( \frac{a^2 + b^2}{c^2 + d^2} \right)$$

## Sets

Inline: $\left\{ x \in \mathbb{R} \mid x > 0 \right\}$

Block:

$$\left\{ x \in \mathbb{R} \mid x > 0 \right\}$$

## Matrices

Simple 2x2 matrix:

$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$

3x3 matrix:

$$\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{pmatrix}$$

## Complex Examples

### Quadratic Formula

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

### Euler's Identity

$$e^{i\pi} + 1 = 0$$

### Binomial Theorem

$$\left(x+y\right)^n = \sum_{k=0}^{n} \binom{n}{k} x^{n-k} y^k$$

### Taylor Series

$$f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n$$

## Mixed Content

Here's a sentence with inline math $\alpha + \beta = \gamma$ followed by a block equation:

$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

And more text with another inline expression $\sum_{i=1}^{n} x_i$.
