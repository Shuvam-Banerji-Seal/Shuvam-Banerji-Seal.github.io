---
title: Drawing benzene's π orbitals from Hückel theory
description: How the benzene figure on the homepage is made: Hückel π orbitals, Slater 2p functions, and points sampled from the probability density, coloured by sign.
date: 2026-11-17
tags: [Quantum chemistry, Hückel theory, Visualisation]
slug: benzene-pi-orbitals-huckel
---

The animated figure on the homepage of this site shows the six π molecular orbitals (MOs) of benzene as clouds of coloured points. The orbital shapes come from Hückel theory and a Slater-type atomic orbital, and the points come from a random sampler. This note goes through each step, with every number checked in Python, so that anyone looking at the figure knows exactly what it shows and what it leaves out.

## The molecule

The figure uses an idealised, planar benzene. The six carbons sit on a regular hexagon in the $xy$ plane at angles $\theta_k = 2\pi k/6$ for $k = 0, 1, \dots, 5$. In a regular hexagon the side equals the distance from the centre to a corner, so a C–C bond length of 1.39 Å puts every carbon 1.39 Å from the centre:

$$
\mathbf{R}_k = R\,(\cos\theta_k,\ \sin\theta_k,\ 0), \qquad R = 1.39\ \text{Å}.
$$

Each hydrogen lies on the same ray as its carbon, 1.09 Å further out, so 2.48 Å from the centre. The hydrogens are drawn for orientation only and take no part in the π system.

## The Hückel model

Hückel's model treats the π electrons of a planar conjugated molecule separately from the σ framework [1, 4]. Each carbon contributes one $2p_z$ orbital $\phi_k$, and a π MO is a linear combination

$$
\psi = \sum_{k=0}^{5} c_k\,\phi_k .
$$

The variation principle turns the Schrödinger equation into the secular equations $\sum_l (H_{kl} - E\,S_{kl})\,c_l = 0$. Hückel then makes three approximations:

- $H_{kk} = \alpha$, the Coulomb integral, the same for every carbon;
- $H_{kl} = \beta$, the resonance integral, when $k$ and $l$ are bonded neighbours, and zero otherwise;
- $S_{kl} = \delta_{kl}$, so overlap between different atoms is neglected.

For a ring the Hamiltonian matrix becomes

$$
\mathbf{H} = \alpha\,\mathbf{1} + \beta\,\mathbf{A},
$$

where $\mathbf{A}$ is the adjacency matrix of the ring: $A_{kl} = 1$ when $l = k \pm 1 \pmod 6$ and zero otherwise. An eigenvector of $\mathbf{A}$ with eigenvalue $\lambda$ is an MO with energy $E = \alpha + \lambda\beta$, so the whole problem is to diagonalise a 6 × 6 matrix of zeros and ones. Written as a secular determinant, $\det(\mathbf{A} - \lambda\mathbf{1}) = 0$ expands to

$$
\lambda^6 - 6\lambda^4 + 9\lambda^2 - 4 = (\lambda - 2)(\lambda + 2)(\lambda - 1)^2(\lambda + 1)^2 = 0 .
$$

### Solving the ring without expanding the determinant

Every carbon in benzene has the same surroundings, so each row of $\mathbf{A}$ is the row above it shifted one place to the right. Matrices with this property are called circulant, and their eigenvectors are discrete Fourier waves. Try $c_k = e^{2\pi i jk/6}$ for an integer $j$:

$$
(\mathbf{A}c)_k = c_{k+1} + c_{k-1} = \left(e^{2\pi i j/6} + e^{-2\pi i j/6}\right) c_k = 2\cos\!\left(\frac{2\pi j}{6}\right) c_k .
$$

The ring closes on itself, $c_{k+6} = c_k$, which is why $j$ must be an integer, and only six values give different vectors: $j = 0, \pm 1, \pm 2, 3$. The energies are

$$
E_j = \alpha + 2\beta\cos\!\left(\frac{2\pi j}{6}\right),
$$

which gives $\alpha + 2\beta$ for $j = 0$, $\alpha + \beta$ for $j = \pm 1$, $\alpha - \beta$ for $j = \pm 2$ and $\alpha - 2\beta$ for $j = 3$.

### Why $j$ and $-j$ are degenerate

The cosine is even, so $E_j = E_{-j}$. Physically, $e^{2\pi i jk/6}$ is a wave running round the ring in one direction and $e^{-2\pi i jk/6}$ is the same wave running the other way. Neither direction is preferred, so the two have the same energy. The two vectors are complex conjugates of each other, and because $\mathbf{A}$ is real, their sum and difference are also eigenvectors with the same eigenvalue. That gives real coefficients:

$$
c_k^{(j,\cos)} \propto \cos\!\left(\frac{2\pi jk}{6}\right), \qquad c_k^{(j,\sin)} \propto \sin\!\left(\frac{2\pi jk}{6}\right).
$$

They are normalised so that $\sum_k c_k^2 = 1$, which is the right normalisation once overlap is neglected. For $j = 1$ and $j = 2$ both sums of squares equal 3, so the factor is $1/\sqrt{3}$. For $j = 0$ and $j = 3$ the sine is zero at every atom and only the cosine survives, with factor $1/\sqrt{6}$. These two levels have no partner, because $-0 = 0$ and $-3 \equiv 3 \pmod 6$, so they are single.

Any rotation of a degenerate pair, $\cos\gamma\,\psi_{\cos} + \sin\gamma\,\psi_{\sin}$, is an equally valid orbital. The figure uses the cosine and sine partners, a choice of orientation rather than a physical fact.

### Why $\alpha + 2\beta$ is the lowest level

Both $\alpha$ and $\beta$ are negative. $\alpha$ is roughly the energy of an electron in a carbon 2p orbital inside the molecule. $\beta = \langle \phi_k|\hat H|\phi_{k+1}\rangle$ couples two neighbouring p orbitals. Its integrand is largest between the two nuclei, where both orbitals have the same sign and the potential energy is strongly negative, so $\beta < 0$. With $\beta < 0$, the larger the coefficient of $\beta$, the lower the energy. The nodeless $j = 0$ orbital at $\alpha + 2\beta$ is therefore the most stable, and the fully alternating $j = 3$ orbital at $\alpha - 2\beta$ is the least.

### Six π electrons and the 4n+2 rule

Benzene has six π electrons, one from each carbon. They fill the three bonding orbitals: two in $\alpha + 2\beta$ and four in the degenerate $\alpha + \beta$ pair. In the $D_{6h}$ point group the levels are labelled $a_{2u}$, $e_{1g}$, $e_{2u}$ and $b_{2g}$ in order of increasing energy, so the HOMO is the degenerate $e_{1g}$ pair and the LUMO is the degenerate $e_{2u}$ pair. The total π energy is

$$
E_\pi = 2(\alpha + 2\beta) + 4(\alpha + \beta) = 6\alpha + 8\beta .
$$

Three isolated ethylene π bonds would give $3 \times 2(\alpha + \beta) = 6\alpha + 6\beta$. The difference, $2\beta$, is the Hückel delocalisation energy.

The same pattern holds for any ring of $N$ carbons, since the energies $\alpha + 2\beta\cos(2\pi j/N)$ always have one single level at the bottom and degenerate pairs above it (plus a single level at the top when $N$ is even). A closed shell needs two electrons for the bottom level and four for each filled pair, so $4n + 2$ π electrons with $n$ filled pairs. This is the 4n+2 rule that now carries Hückel's name, and benzene is the case $n = 1$ [5].

## Checking the numbers

The snippet below builds the adjacency matrix, prints its characteristic polynomial, diagonalises it with numpy, and checks that the cosine and sine vectors above are eigenvectors.

```python
import numpy as np

N = 6
A = np.zeros((N, N))                  # adjacency matrix of the ring
for k in range(N):
    A[k, (k + 1) % N] = A[(k + 1) % N, k] = 1.0

print("characteristic polynomial:", np.round(np.poly(A)).astype(int))

# H = alpha*1 + beta*A, so each eigenvalue lam of A gives E = alpha + lam*beta
lam, vecs = np.linalg.eigh(A)
for x in lam[::-1]:                   # beta < 0: largest lam is lowest E
    print(f"E = alpha {x:+.3f} beta")

# the cos/sin vectors from the text are eigenvectors of A
k = np.arange(N)
for j in range(4):
    for f in (np.cos, np.sin):
        c = f(2 * np.pi * j * k / N)
        if np.allclose(c, 0):
            continue                  # sin with j = 0 or 3 vanishes
        c = c / np.linalg.norm(c)
        x = c @ A @ c
        assert np.allclose(A @ c, x * c)
        print(f"j={j} {f.__name__}: lam={x:+.0f}  c={np.round(c, 3) + 0.0}")
```

Running it with `python3 -I` prints:

```text
characteristic polynomial: [ 1  0 -6  0  9  0 -4]
E = alpha +2.000 beta
E = alpha +1.000 beta
E = alpha +1.000 beta
E = alpha -1.000 beta
E = alpha -1.000 beta
E = alpha -2.000 beta
j=0 cos: lam=+2  c=[0.408 0.408 0.408 0.408 0.408 0.408]
j=1 cos: lam=+1  c=[ 0.577  0.289 -0.289 -0.577 -0.289  0.289]
j=1 sin: lam=+1  c=[ 0.   0.5  0.5  0.  -0.5 -0.5]
j=2 cos: lam=-1  c=[ 0.577 -0.289 -0.289  0.577 -0.289 -0.289]
j=2 sin: lam=-1  c=[ 0.   0.5 -0.5  0.   0.5 -0.5]
j=3 cos: lam=-2  c=[ 0.408 -0.408  0.408 -0.408  0.408 -0.408]
```

The polynomial coefficients match the expansion above, and the eigenvalues show the 1, 2, 2, 1 pattern of degeneracies.

## From coefficients to an orbital in space

The coefficients say how much of each carbon's p orbital goes into an MO. To draw the MO, each $\phi_k$ needs a shape. The figure uses a Slater-type orbital centred on carbon $k$:

$$
\phi_k(\mathbf r) = N\,z\,e^{-\zeta\,|\mathbf r - \mathbf R_k|}, \qquad N = \sqrt{\zeta^5/\pi},
$$

which is the $n = 2$, $l = 1$, $m = 0$ Slater function (the factor $z$ is $r\cos\theta$ measured from the nucleus, and every carbon has $z_k = 0$).

The exponent comes from Slater's rules [2]. Carbon is $(1s)^2(2s,2p)^4$. For a $2p$ electron, each of the other three electrons in the $(2s,2p)$ group screens 0.35 of a nuclear charge and each of the two $1s$ electrons screens 0.85:

$$
S = 3 \times 0.35 + 2 \times 0.85 = 1.05 + 1.70 = 2.75,
$$

$$
Z_\mathrm{eff} = Z - S = 6 - 2.75 = 3.25, \qquad \zeta = \frac{Z_\mathrm{eff}}{n} = \frac{3.25}{2} = 1.625\ a_0^{-1}.
$$

For $n \le 3$ Slater's effective principal quantum number equals $n$, so the divisor is 2. The geometry is in ångströms, so the exponent has to be converted: $1.625 / 0.529177 = 3.07$ Å⁻¹. Along the $z$ axis above a nucleus, $z\,e^{-\zeta z}$ peaks at $z = 1/\zeta = 0.615\,a_0$, which is 0.33 Å. That is where each lobe is densest.

Two simplifications remain. First, neighbouring $2p_z$ orbitals do overlap. With this exponent and spacing the π overlap integral is $S_{01} = e^{-p}(1 + p + 2p^2/5 + p^3/15) = 0.248$, where $p = \zeta R_\mathrm{CC} = 4.27$ (the closed form of Mulliken and co-workers [3], confirmed by numerical integration). So $S_{kl} = \delta_{kl}$ is a real approximation and the MOs are not exactly normalised in three dimensions. That does not matter for the figure, because the sampler only uses ratios of $|\psi|^2$. Second, Hückel theory with a fixed Slater exponent gives the right ordering and nodal structure, not quantitative orbital energies; those need a self-consistent calculation such as [Kohn–Sham DFT](./kohn-sham-dft-on-one-page.html).

## Drawing the probability density with points

The figure places a few thousand points so that their density follows $|\psi(\mathbf r)|^2$. It uses rejection sampling inside a box around the molecule:

1. Find an upper bound $p_\mathrm{max}$ on $|\psi|^2$ inside the box.
2. Draw a point $\mathbf u$ uniformly in the box.
3. Keep it with probability $|\psi(\mathbf u)|^2 / p_\mathrm{max}$, that is, keep it if a second uniform number in $[0, 1)$ is smaller than that ratio.
4. Repeat until enough points have been kept.

The chance that a trial point lands in a small volume $dV$ and is kept is proportional to $|\psi|^2\,dV$, so the kept points follow $|\psi|^2$ exactly within the box. The bound must really be an upper bound: if $|\psi|^2/p_\mathrm{max}$ exceeds 1 anywhere, the densest regions are clipped and look flatter than they are. The box must also hold almost all of the density without wasting most trials.

A box of ±3.4 Å in $x$ and $y$ and ±2.2 Å in $z$ holds more than 99.9 per cent of $|\psi|^2$ for all six MOs. Estimating the maximum on a 61 × 61 × 61 grid comes close: the true maximum is at most 3.2 per cent above the grid value for these six MOs, so a 5 per cent margin is safe. A bound that is safe by construction exists, $|\psi| \le \sum_k |c_k| / (\zeta e)$, because no unnormalised $z\,e^{-\zeta r}$ exceeds $1/(\zeta e)$, but it accepts 15 to 40 times fewer points. With the grid estimate, roughly 1 to 3 per cent of trials are kept, so 4,000 points cost a few hundred thousand evaluations of $\psi$, each a sum of six exponentials.

```python
import numpy as np

BOHR = 0.529177                       # angstrom
ZETA = 1.625 / BOHR                   # 3.07 per angstrom
ang = 2 * np.pi * np.arange(6) / 6
CARBONS = 1.39 * np.stack([np.cos(ang), np.sin(ang), np.zeros(6)], axis=1)

def psi(p, c):
    """Unnormalised pi MO at points p (shape (n, 3), angstrom)."""
    d = p[:, None, :] - CARBONS[None, :, :]          # (n, 6, 3)
    r = np.linalg.norm(d, axis=2)
    return (c * d[:, :, 2] * np.exp(-ZETA * r)).sum(axis=1)

def sample(c, n_points, rng, half=(3.4, 3.4, 2.2)):
    half = np.array(half)
    g = np.linspace(-1, 1, 61)[:, None] * half       # grid estimate of max |psi|^2
    grid = np.stack(np.meshgrid(*g.T, indexing="ij"), -1).reshape(-1, 3)
    p_max = 1.05 * (psi(grid, c) ** 2).max()          # 5 % safety margin
    kept, tried = [], 0
    while sum(len(k) for k in kept) < n_points:
        u = rng.uniform(-half, half, size=(50_000, 3))
        accept = rng.uniform(size=len(u)) < psi(u, c) ** 2 / p_max
        kept.append(u[accept])
        tried += len(u)
    pts = np.concatenate(kept)
    rate = len(pts) / tried                           # fraction accepted
    pts = pts[:n_points]
    return pts, np.sign(psi(pts, c)), rate

rng = np.random.default_rng(0)
k = np.arange(6)
c = np.cos(2 * np.pi * k / 6) / np.sqrt(3)            # one e1g (HOMO) partner
pts, sign, rate = sample(c, 4000, rng)
print(f"acceptance {rate:.3f}; + points {np.mean(sign > 0):.3f}; "
      f"above plane {np.mean(pts[:, 2] > 0):.3f}")
```

```text
acceptance 0.013; + points 0.499; above plane 0.497
```

Each point is then coloured by the sign of $\psi$ at that point: vermilion where $\psi > 0$ and teal where $\psi < 0$. The density $|\psi|^2$ alone cannot show sign, and the relative sign of neighbouring lobes is what separates bonding from antibonding contacts. The overall sign of an MO carries no meaning, since $\psi$ and $-\psi$ describe the same state, so swapping the two colours everywhere would show the same orbital.

## Why points and not an isosurface

Most orbital pictures are isosurfaces: the surface on which $|\psi|$ equals a chosen value, with one colour for each sign. The size of that surface depends entirely on the chosen value, which is a display setting and not a property of the molecule. Raise it and the lobes shrink towards wherever $|\psi|$ is largest; lower it and lobes of the same sign merge into larger shapes. A surface also has a hard edge, which suggests the electron is inside it and nowhere else.

A point cloud has no threshold. The expected number of points in any region is proportional to the probability of finding the electron there, so regions can be compared fairly: dense where the electron is likely, sparse in the tails, and nothing hidden behind a cut-off. The price is noise. A region expected to hold $n$ points holds roughly $n \pm \sqrt{n}$, so faint features need more points before they can be trusted, and in a flat projection points at different depths overlap.

## Nodal planes

Every π MO is built from $2p_z$ orbitals, and each of those is odd in $z$, so $\psi(x, y, -z) = -\psi(x, y, z)$. The molecular plane is therefore a nodal plane of every π orbital, and in the figure each region above the plane has the opposite colour to its mirror image below it.

On top of that, the MOs have vertical nodes, which contain the sixfold axis. The coefficient pattern $\cos(2\pi jk/6)$ or $\sin(2\pi jk/6)$ changes sign $2|j|$ times going round the ring, which gives $|j|$ vertical nodal planes:

| MO | $D_{6h}$ label | Energy | $j$ | Vertical nodal planes | Electrons in benzene |
|---|---|---|---|---|---|
| 1 | $a_{2u}$ | $\alpha + 2\beta$ | 0 | 0 | 2 |
| 2, 3 | $e_{1g}$ (HOMO) | $\alpha + \beta$ | ±1 | 1 | 4 |
| 4, 5 | $e_{2u}$ (LUMO) | $\alpha - \beta$ | ±2 | 2 | 0 |
| 6 | $b_{2g}$ | $\alpha - 2\beta$ | 3 | 3 | 0 |

The count rises with energy because each extra node turns more bonding contacts between neighbours into antibonding ones. In the $j = 3$ orbital every pair of neighbours has opposite signs.

The figure also shows a detail that textbook drawings smooth over. Most of these nodes are exact planes, because the orbital changes sign under a mirror reflection of the hexagon. That holds for both $e_{1g}$ partners, for the sine partner of $e_{2u}$ and for $b_{2g}$. The cosine partner of $e_{2u}$, with coefficients $(1, -\tfrac12, -\tfrac12, 1, -\tfrac12, -\tfrac12)/\sqrt3$, has no such mirror. Its two nodal surfaces cross at right angles on the sixfold axis but bend as they move outwards: 0.33 Å above the plane, the node sits at about 44° from the direction of carbon 0 near the axis and at about 35° at the radius of the carbon ring. They still count as two nodal planes, because they divide the ring into the same four sign regions.

Finally, each partner of a degenerate pair has lower symmetry than the molecule, but the pair together does not: the summed density $|\psi_{\cos}|^2 + |\psi_{\sin}|^2$ of the $e_{1g}$ HOMO pair, which holds four of the six π electrons, is unchanged by a 60° rotation about the axis.

## References

1. E. Hückel, "Quantentheoretische Beiträge zum Benzolproblem. I. Die Elektronenkonfiguration des Benzols und verwandter Verbindungen", *Zeitschrift für Physik* 70, 204–286 (1931). https://doi.org/10.1007/BF01339530
2. J. C. Slater, "Atomic Shielding Constants", *Physical Review* 36, 57–64 (1930). https://doi.org/10.1103/PhysRev.36.57
3. R. S. Mulliken, C. A. Rieke, D. Orloff and H. Orloff, "Formulas and Numerical Tables for Overlap Integrals", *Journal of Chemical Physics* 17, 1248–1267 (1949). https://doi.org/10.1063/1.1747150
4. P. W. Atkins and R. S. Friedman, *Molecular Quantum Mechanics*, 5th edition, Oxford University Press (2011). ISBN 978-0-19-954142-3.
5. A. Streitwieser Jr., *Molecular Orbital Theory for Organic Chemists*, John Wiley & Sons, New York (1961).
