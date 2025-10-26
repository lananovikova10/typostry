# Mathematics and LaTeX Formulas

This document demonstrates LaTeX math rendering using KaTeX.

## Inline Math

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ where $a \neq 0$.

Einstein's famous equation: $E = mc^2$

The Pythagorean theorem: $a^2 + b^2 = c^2$

## Block Math Equations

### Quadratic Formula

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### Calculus - Fundamental Theorem

$$
\int_a^b f(x) \, dx = F(b) - F(a)
$$

### Linear Algebra - Matrix Multiplication

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

### Summation and Limits

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

$$
\lim_{x \to \infty} \frac{1}{x} = 0
$$

### Taylor Series

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$

### Derivatives

$$
\frac{d}{dx} \left( \sin(x) \right) = \cos(x)
$$

$$
\frac{d}{dx} \left( e^x \right) = e^x
$$

### Complex Numbers - Euler's Identity

$$
e^{i\pi} + 1 = 0
$$

This is often called "the most beautiful equation in mathematics."

### Trigonometry

$$
\sin^2(x) + \cos^2(x) = 1
$$

$$
\tan(x) = \frac{\sin(x)}{\cos(x)}
$$

### Binomial Theorem

$$
(x + y)^n = \sum_{k=0}^{n} \binom{n}{k} x^{n-k} y^k
$$

Where the binomial coefficient is:

$$
\binom{n}{k} = \frac{n!}{k!(n-k)!}
$$

### Statistics - Normal Distribution

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$

### Vector Calculus - Divergence Theorem

$$
\iiint_V (\nabla \cdot \mathbf{F}) \, dV = \iint_S (\mathbf{F} \cdot \mathbf{n}) \, dS
$$

### Greek Letters and Symbols

- Alpha: $\alpha$, Beta: $\beta$, Gamma: $\gamma$, Delta: $\delta$
- Epsilon: $\epsilon$, Theta: $\theta$, Lambda: $\lambda$, Pi: $\pi$
- Sigma: $\sigma$, Omega: $\omega$, Phi: $\phi$, Psi: $\psi$

### Set Theory

$$
A \cup B = \{x : x \in A \text{ or } x \in B\}
$$

$$
A \cap B = \{x : x \in A \text{ and } x \in B\}
$$

$$
A \subseteq B \iff \forall x (x \in A \Rightarrow x \in B)
$$

### Logic Symbols

- Conjunction: $p \land q$
- Disjunction: $p \lor q$
- Negation: $\neg p$
- Implication: $p \Rightarrow q$
- Equivalence: $p \Leftrightarrow q$

### Number Theory - Fermat's Last Theorem

$$
x^n + y^n = z^n
$$

has no non-zero integer solutions for $x$, $y$, and $z$ when $n > 2$.

### Differential Equations

$$
\frac{dy}{dx} + P(x)y = Q(x)
$$

### Maxwell's Equations

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}
$$

$$
\nabla \cdot \mathbf{B} = 0
$$

$$
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
$$

$$
\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \epsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

## Mixed Content

You can mix inline math $f(x) = x^2 + 2x + 1$ with regular text seamlessly.

The roots of the equation can be found where $f(x) = 0$, which gives us:

$$
x^2 + 2x + 1 = 0 \\
(x + 1)^2 = 0 \\
x = -1
$$

## Complex Expressions

$$
\mathcal{L}\{f(t)\} = F(s) = \int_0^{\infty} e^{-st} f(t) \, dt
$$

$$
\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u
$$

$$
\det(A) = \sum_{\sigma \in S_n} \text{sgn}(\sigma) \prod_{i=1}^n a_{i,\sigma(i)}
$$

## End Notes

This document tests the math rendering capabilities of the markdown editor using KaTeX. All formulas should render properly with appropriate spacing and styling.
