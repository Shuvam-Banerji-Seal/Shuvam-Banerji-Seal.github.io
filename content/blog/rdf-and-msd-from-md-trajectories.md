---
title: "Reading an MD trajectory: radial distribution function and mean squared displacement"
description: How to compute g(r) and the mean squared displacement from a periodic MD trajectory, with a short numpy implementation tested on cases with known answers.
date: 2026-11-17
tags: [Molecular dynamics, Statistical mechanics, Python]
slug: rdf-and-msd-from-md-trajectories
---

A molecular dynamics run produces a trajectory: the positions of $N$ atoms in a periodic box, saved every few steps. Two quantities are almost always the first things computed from it. The radial distribution function $g(r)$ describes the structure, how atoms arrange themselves around one another. The mean squared displacement (MSD) describes the dynamics, and its long-time slope gives the self-diffusion coefficient $D$. Both are simple to define and easy to get subtly wrong, mostly because of the periodic box. This note gives the definitions, the conditions under which they hold, and a short numpy implementation that is tested on two cases where the right answer is known in advance.

## What a trajectory holds

Take a cubic box of side $L$ with periodic boundaries, so an atom that leaves through one face re-enters through the opposite one. Programs can save positions in two ways. Wrapped coordinates are folded back into the box, so they jump by $L$ whenever an atom crosses a face. Unwrapped coordinates follow the atom continuously, as if the box had no walls. LAMMPS can write either, `x y z` for wrapped and `xu yu zu` for unwrapped, and it can also write image flags `ix iy iz`, integers that count how many times the atom has crossed each face, so that $x_\text{unwrapped} = x + i_x L$ for an orthogonal box [3]. As the next sections show, $g(r)$ only needs the minimum-image convention, which works with either kind, while the MSD needs unwrapped coordinates.

## The radial distribution function

Pick an atom and count how many other atoms sit in a thin spherical shell between $r$ and $r + \Delta r$ around it. Average that count over all atoms and all frames, and divide by what the count would be if the other atoms were spread uniformly at the bulk number density $\rho = N/V$:

$$
g(r) = \frac{\langle n(r, r + \Delta r) \rangle}{\rho\,4\pi r^2\,\Delta r} .
$$

The denominator is the ideal-gas normalisation: $4\pi r^2\,\Delta r$ is the volume of the shell, and $\rho$ times that volume is the expected number of atoms in it when positions are uncorrelated. In code it is better to use the exact shell volume $\tfrac{4}{3}\pi\left[(r + \Delta r)^3 - r^3\right]$, which tends to $4\pi r^2\,\Delta r$ for thin shells but stays correct for wide bins near $r = 0$.

Counting pairs is cheaper than counting around each atom separately. If $h_b$ is the number of unordered pairs per frame whose separation falls in bin $b$, each pair contributes to the neighbour count of both of its atoms, so

$$
g(r_b) = \frac{2\,h_b}{N\,\rho\,V_b},
$$

with $V_b$ the volume of shell $b$ [1, 2]. In a liquid $g(r)$ is zero at short distances, where repulsion keeps atoms apart, rises to a first peak at the nearest-neighbour distance, oscillates through further coordination shells, and tends to 1 at large $r$. Integrating it over the first peak gives the coordination number, $n_c = 4\pi\rho \int_0^{r_\text{min}} r^2 g(r)\,dr$, where $r_\text{min}$ is the first minimum.

For an ideal gas $g(r) = 1$ at every distance. A finite system gives a little less, $(N - 1)/N$, because an atom is never its own neighbour: there are $N - 1$ other atoms, not $N$. With 500 atoms that is 0.998, a correction that some codes remove by using $(N - 1)/V$ for the density.

### The minimum-image convention

In a periodic box every atom has infinitely many images, displaced by multiples of $L$ along each axis. The distance that matters is the one to the nearest image, which is found by shifting each component of the separation vector into $[-L/2, L/2]$:

$$
d_\alpha \leftarrow d_\alpha - L\,\operatorname{round}(d_\alpha / L), \qquad \alpha = x, y, z .
$$

### Why the largest distance is half the box

The minimum-image separation vector always lies inside a cube of side $L$ centred on the first atom. A sphere of radius $r \le L/2$ fits entirely inside that cube, so every neighbour at that distance is found exactly once. A sphere with $r > L/2$ pokes out through the six faces, and the parts of the shell outside the cube are never reported, because those atoms have a nearer image somewhere else. The count falls short of the ideal value and $g(r)$ drops for purely geometric reasons. For $L/2 < r < L/\sqrt2$, the fraction of the shell left inside the cube is $1 - 3\left(1 - \frac{L}{2r}\right)$: 0.857 at $r = 0.525\,L$, 0.609 at $0.575\,L$ and 0.400 at $0.625\,L$. Histogramming an ideal gas without the limit reproduces those numbers (0.853, 0.606 and 0.399 in bins centred there). So $r_\text{max} \le L/2$ is a hard limit, not a rule of thumb. For a triclinic box the limit is half the smallest perpendicular width of the cell.

## Mean squared displacement

The MSD at lag time $t$ is the average of the squared distance an atom has moved over a time $t$:

$$
\mathrm{MSD}(t) = \left\langle \left| \mathbf r_i(t_0 + t) - \mathbf r_i(t_0) \right|^2 \right\rangle_{i,\,t_0},
$$

averaged over atoms $i$ and over time origins $t_0$. In a fluid, at long times, the MSD grows linearly, and the slope gives the self-diffusion coefficient through the Einstein relation [4]. In three dimensions

$$
D = \lim_{t \to \infty} \frac{\mathrm{MSD}(t)}{6t},
$$

and in $d$ dimensions the 6 becomes $2d$.

### Ballistic and diffusive regimes

At times much shorter than the time between collisions, an atom moves in a nearly straight line, $\mathbf r(t_0 + t) - \mathbf r(t_0) \approx \mathbf v\,t$, so $\mathrm{MSD} \approx \langle v^2 \rangle t^2 = (3k_\mathrm{B}T/m)\,t^2$. This is the ballistic regime, and on a log-log plot it has slope 2. Once collisions have randomised the velocity, the motion becomes a random walk and the MSD grows as $6Dt$, with slope 1. A simple model that contains both is a particle whose velocity relaxes with time constant $\tau$ (Langevin dynamics). Its MSD is

$$
\mathrm{MSD}(t) = 6\,\frac{k_\mathrm{B}T}{m}\,\tau^2 \left( \frac{t}{\tau} - 1 + e^{-t/\tau} \right), \qquad D = \frac{k_\mathrm{B}T\,\tau}{m},
$$

which tends to $3(k_\mathrm{B}T/m)\,t^2$ for $t \ll \tau$ and to $6D(t - \tau)$ for $t \gg \tau$. A short simulation of this model (500 particles, $k_\mathrm{B}T/m = 1$, $\tau = 1$) matches the formula to better than 1 per cent from $t = 0.1\,\tau$ to $t = 30\,\tau$. The offset $-6D\tau$ is a practical warning: $\mathrm{MSD}(t)/6t$ at a single time approaches $D$ only as $1 - \tau/t$, so it is better to fit a straight line to the linear part and take $D$ as the slope divided by 6.

### Averaging over time origins

Any saved frame can serve as the time origin $t_0$. For a lag of $k$ frames in a trajectory of $T$ frames there are $T - k$ origins, and using all of them improves the statistics considerably. Origins closer together than the velocity decorrelation time are not independent, so taking every few frames as an origin saves time with little loss. At long lags only a few origins remain and the MSD becomes noisy, so the fit should use lags well short of the full trajectory length. For long trajectories the sum over origins can also be done with fast Fourier transforms.

### Unwrapped coordinates

The MSD needs continuous paths. With wrapped coordinates, an atom that crosses a face appears to jump by $L$, which ruins the average. There are three ways to get continuous paths: write unwrapped coordinates in the first place, add image flags times $L$, or rebuild the path by adding up minimum-image displacements between consecutive frames. The last method is only valid if no atom moves more than $L/2$ between two saved frames.

What does not work is applying the minimum-image convention to the whole displacement over a long lag. That caps each component at $L/2$, and once the true displacement is much larger than the box, the folded displacement is spread evenly over the cube, so the MSD flattens at $3 \times L^2/12 = (L/2)^2$. For a longer run (6,000 steps) of the random walk used in the test below, in a box of side 15 Å, the MSD from the unwrapped path at a lag of 500 ps was about 650 Å², while the minimum-image version sat at 56.3 Å², right on $(L/2)^2 = 56.25$ Å². A plateau like that looks like caged motion but is entirely an artefact.

## A compact numpy implementation

The functions below take a trajectory as an array of shape `(T, N, 3)` for a cubic box of side `L`. The RDF loops over frames and handles all pairs of a frame at once, which is fine for a few thousand atoms; beyond that, a cell list avoids computing every pair.

```python
import numpy as np

def rdf(frames, L, r_max, n_bins=100):
    """g(r) for wrapped positions frames[t, i, :] in a cubic box of side L."""
    if r_max > L / 2:
        raise ValueError("r_max must be at most L/2")
    T, N, _ = frames.shape
    edges = np.linspace(0.0, r_max, n_bins + 1)
    counts = np.zeros(n_bins)
    i, j = np.triu_indices(N, k=1)           # each unordered pair once
    for x in frames:
        d = x[i] - x[j]
        d -= L * np.round(d / L)              # minimum-image convention
        counts += np.histogram(np.linalg.norm(d, axis=1), bins=edges)[0]
    rho = N / L**3
    shell = 4.0 / 3.0 * np.pi * (edges[1:]**3 - edges[:-1]**3)
    ideal = 0.5 * N * rho * shell             # pairs expected per frame
    return 0.5 * (edges[1:] + edges[:-1]), counts / (T * ideal)

def unwrap(frames, L):
    """Rebuild continuous paths from wrapped positions (needs |step| < L/2)."""
    d = np.diff(frames, axis=0)
    d -= L * np.round(d / L)
    return np.concatenate([frames[:1], frames[:1] + np.cumsum(d, axis=0)])

def msd(x, max_lag, origin_stride=1):
    """MSD(lag) from unwrapped positions x[t, i, :], averaged over atoms and time origins."""
    out = np.zeros(max_lag + 1)
    for lag in range(1, max_lag + 1):
        d = x[lag::origin_stride] - x[:-lag:origin_stride]
        out[lag] = np.mean(np.sum(d**2, axis=-1))
    return out
```

The normalisation in `rdf` is the pair-counting formula above: `ideal` is the number of pairs per frame expected in each shell for uncorrelated positions, so dividing by it gives $g(r)$ directly. In `msd`, the slice `x[lag::s] - x[:-lag:s]` pairs every chosen origin with the frame `lag` steps later, for all atoms at once.

## Testing on cases with known answers

Two synthetic trajectories have known answers. Uniformly random positions are an ideal gas, so $g(r)$ should be $(N - 1)/N$ everywhere. A random walk whose Cartesian steps are drawn from a normal distribution of variance $2D\,\Delta t$ has $\mathrm{MSD}(t) = 3 \times 2D\,\Delta t \times (t/\Delta t) = 6Dt$ exactly, so the fitted $D$ should match the one put in. The walk is wrapped into the box first, as a dump with `x y z` would store it, so the test also checks `unwrap`.

```python
rng = np.random.default_rng(42)

# 1. Ideal gas: positions are uncorrelated, so g(r) = (N - 1)/N at every r
L, N, T = 20.0, 500, 200
gas = rng.uniform(0.0, L, size=(T, N, 3))
r, g = rdf(gas, L, r_max=L / 2, n_bins=50)
print(f"ideal gas: mean g = {g[r > 2].mean():.4f}, spread {g[r > 2].std():.4f}, "
      f"(N-1)/N = {(N - 1) / N:.4f}")

# 2. Random walk: each Cartesian step is Normal(0, 2 D dt), so MSD = 6 D t
D, dt, steps, N, L = 0.23, 0.1, 2000, 400, 15.0     # A^2/ps, ps, -, -, A
path = rng.uniform(0.0, L, size=(1, N, 3)) + np.cumsum(
    rng.normal(0.0, np.sqrt(2 * D * dt), size=(steps, N, 3)), axis=0)
x = unwrap(path % L, L)                  # what a wrapped dump gives back
print("unwrap recovers the path:", np.allclose(x - x[0], path - path[0]))
m = msd(x, max_lag=200)
t = dt * np.arange(201)
slope = np.polyfit(t[20:], m[20:], 1)[0]
print(f"random walk: D = {slope / 6:.4f} A^2/ps (exact {D})")
```

Run with `python3 -I` as one file together with the functions above, it prints:

```text
ideal gas: mean g = 0.9983, spread 0.0019, (N-1)/N = 0.9980
unwrap recovers the path: True
random walk: D = 0.2278 A^2/ps (exact 0.23)
```

The ideal-gas average agrees with $(N - 1)/N$ to within its bin-to-bin spread, ignoring the first ten bins (below 2 Å), where the shells are so small that the counts are noisy. The fitted diffusion coefficient is within 1 per cent of the input; repeating the walk with twelve different seeds gives a scatter of about 1.2 per cent, so the difference is statistical. The input 0.23 Å²/ps equals $2.3 \times 10^{-9}$ m²/s, close to the measured self-diffusion coefficient of liquid water at 25 °C [5].

## The same analysis in the browser

Molecule3D, my browser workbench for LAMMPS, computes both quantities for a dump trajectory without uploading it anywhere ([Molecule3D: a LAMMPS workbench that runs in your browser](./molecule3d-lammps-in-the-browser.html)). Its RDF uses the minimum-image convention with a periodic cell list, and it limits $r_\text{max}$ to just under half the smallest box side, by the argument above. Its MSD uses unwrapped coordinates when the dump has them, rebuilds them from `ix iy iz` image flags when those are present, and otherwise falls back to the minimum-image convention and says so, since that MSD flattens near $(L/2)^2$. The physics is covered by unit tests of the same kind as the ones above: $g(r) \to 1$ for a random gas, and an MSD that stays correct when atoms cross a periodic face.

## References

1. M. P. Allen and D. J. Tildesley, *Computer Simulation of Liquids*, 2nd edition, Oxford University Press (2017). https://doi.org/10.1093/oso/9780198803195.001.0001
2. D. Frenkel and B. Smit, *Understanding Molecular Simulation: From Algorithms to Applications*, 2nd edition, Academic Press (2002). https://doi.org/10.1016/B978-0-12-267351-1.X5000-7
3. LAMMPS documentation, "dump command". https://docs.lammps.org/dump.html
4. A. Einstein, "Über die von der molekularkinetischen Theorie der Wärme geforderte Bewegung von in ruhenden Flüssigkeiten suspendierten Teilchen", *Annalen der Physik* 322, 549–560 (1905). https://doi.org/10.1002/andp.19053220806
5. R. Mills, "Self-diffusion in normal and heavy water in the range 1–45°", *Journal of Physical Chemistry* 77, 685–688 (1973). https://doi.org/10.1021/j100624a025
