# Kohn–Sham DFT on one page

> The chain of ideas behind a DFT calculation, from Born–Oppenheimer and the Hohenberg–Kohn theorems to the Kohn–Sham equations, functionals and basis sets.

By Shuvam Banerji Seal, 28 Jun 2026. Canonical page: https://shuvam-banerji-seal.github.io/pages/blogs/kohn-sham-dft-on-one-page.html

Density functional theory (DFT) is the method behind most electronic-structure calculations on molecules and solids today, from a geometry optimisation in Gaussian to a band structure in Quantum ESPRESSO. This page lays out the chain of ideas in order, with each equation written out, so that the input keywords of either program have a clear meaning. A longer version, chapter by chapter with runnable Python, is in my [DFT notes](https://shuvam-banerji-seal.github.io/DFT-notes/).

## The problem DFT solves

A molecule is a set of nuclei and electrons. A proton is about 1836 times heavier than an electron, so the electrons adjust almost instantly to any motion of the nuclei. The Born–Oppenheimer approximation [1] uses this to separate the two: fix the nuclei at positions $\mathbf R_A$, solve for the electrons, and treat the resulting electronic energy as the potential energy surface on which the nuclei move. In atomic units the electronic Hamiltonian for $N$ electrons is

$$
\hat H = -\frac12 \sum_{i=1}^{N} \nabla_i^2 + \sum_{i=1}^{N} v_\mathrm{ext}(\mathbf r_i) + \sum_{i<j} \frac{1}{|\mathbf r_i - \mathbf r_j|}, \qquad v_\mathrm{ext}(\mathbf r) = -\sum_A \frac{Z_A}{|\mathbf r - \mathbf R_A|} .
$$

The three terms are the kinetic energy, the attraction to the nuclei, and the electron–electron repulsion. The last term couples every electron to every other, so the wavefunction $\Psi(\mathbf x_1, \dots, \mathbf x_N)$ cannot be split into one-electron pieces and depends on all $3N$ spatial coordinates at once (plus spins). Storing it on even a coarse grid of 10 points per coordinate would take $10^{3N}$ numbers, which for the 10 electrons of a water molecule is already $10^{30}$.

The electron density

$$
n(\mathbf r) = N \sum_{s_1} \int |\Psi(\mathbf r s_1, \mathbf x_2, \dots, \mathbf x_N)|^2 \, d\mathbf x_2 \cdots d\mathbf x_N
$$

is a function of only three variables, whatever $N$ is. DFT is the statement that this much smaller object is enough.

## The Hohenberg–Kohn theorems (1964)

Hohenberg and Kohn proved two results [2].

**First theorem.** For a non-degenerate ground state, the density $n_0(\mathbf r)$ determines the external potential $v_\mathrm{ext}(\mathbf r)$ up to an additive constant. The proof is short. Suppose two potentials that differ by more than a constant had the same ground-state density $n_0$, with ground states $\Psi_1$, $\Psi_2$ and energies $E_1$, $E_2$. Using $\Psi_2$ as a trial function for $\hat H_1$ gives $E_1 < E_2 + \int (v_1 - v_2)\,n_0\,d\mathbf r$, and the same argument the other way round gives $E_2 < E_1 + \int (v_2 - v_1)\,n_0\,d\mathbf r$. Adding the two gives $E_1 + E_2 < E_1 + E_2$, a contradiction. Since $v_\mathrm{ext}$ and $N = \int n\,d\mathbf r$ fix the Hamiltonian, the ground-state density fixes everything about the system, including its energy.

**Second theorem.** There is a universal functional $F[n] = \langle \Psi | \hat T + \hat V_{ee} | \Psi \rangle$, the same for every molecule, such that

$$
E_v[n] = F[n] + \int v_\mathrm{ext}(\mathbf r)\, n(\mathbf r)\, d\mathbf r \ \ge\ E_0
$$

for any admissible density, with equality at the true ground-state density. The ground state can therefore be found by minimising over densities instead of wavefunctions. Levy's constrained search [3] later gave $F[n]$ a definition that works for any density coming from an $N$-electron wavefunction, including degenerate ground states.

The theorems prove that $F[n]$ exists. They do not say what it is, and the kinetic-energy part in particular is very hard to write directly in terms of $n$.

## The Kohn–Sham construction (1965)

Kohn and Sham's idea [4] was to borrow the kinetic energy from a system that is easy to solve. Imagine $N$ non-interacting electrons moving in some effective potential $v_s(\mathbf r)$, chosen so that their ground-state density equals the density of the real, interacting system. Their wavefunction is a single Slater determinant of orbitals $\phi_i$, and

$$
n(\mathbf r) = \sum_{i=1}^{N} |\phi_i(\mathbf r)|^2
$$

(summing over occupied spin orbitals). The total energy is split into four pieces, three of which are known exactly:

$$
E[n] = T_s[n] + E_\mathrm{ext}[n] + E_\mathrm{H}[n] + E_\mathrm{xc}[n],
$$

$$
T_s = -\frac12 \sum_{i=1}^{N} \langle \phi_i | \nabla^2 | \phi_i \rangle, \qquad E_\mathrm{ext} = \int v_\mathrm{ext}(\mathbf r)\, n(\mathbf r)\, d\mathbf r, \qquad E_\mathrm{H} = \frac12 \iint \frac{n(\mathbf r)\, n(\mathbf r')}{|\mathbf r - \mathbf r'|}\, d\mathbf r\, d\mathbf r' .
$$

$T_s$ is the kinetic energy of the non-interacting electrons, $E_\mathrm{ext}$ the attraction to the nuclei, and $E_\mathrm{H}$ the Hartree energy, the classical repulsion of the density with itself. Everything else goes into the exchange–correlation energy, defined as the remainder:

$$
E_\mathrm{xc}[n] = \left(T[n] - T_s[n]\right) + \left(V_{ee}[n] - E_\mathrm{H}[n]\right).
$$

It contains exchange, correlation, the part of the true kinetic energy that $T_s$ misses, and the correction for the self-repulsion that $E_\mathrm{H}$ wrongly includes. It is a modest fraction of the total energy, but chemical bonding depends on it sensitively, and it is where all the approximation in practical DFT lives.

Minimising $E[n]$ with respect to the orbitals, keeping them orthonormal, gives the Kohn–Sham equations:

$$
\left[ -\frac12 \nabla^2 + v_\mathrm{ext}(\mathbf r) + v_\mathrm{H}(\mathbf r) + v_\mathrm{xc}(\mathbf r) \right] \phi_i(\mathbf r) = \varepsilon_i\, \phi_i(\mathbf r),
$$

$$
v_\mathrm{H}(\mathbf r) = \int \frac{n(\mathbf r')}{|\mathbf r - \mathbf r'|}\, d\mathbf r', \qquad v_\mathrm{xc}(\mathbf r) = \frac{\delta E_\mathrm{xc}[n]}{\delta n(\mathbf r)} .
$$

These look like one-electron Schrödinger equations, and with the exact $E_\mathrm{xc}$ they would give the exact ground-state density and energy. The total energy is not simply the sum of the eigenvalues, because $\sum_i \varepsilon_i$ counts the Hartree energy twice and includes $\int v_\mathrm{xc}\, n$ instead of $E_\mathrm{xc}$:

$$
E = \sum_{i=1}^{N} \varepsilon_i - E_\mathrm{H}[n] - \int v_\mathrm{xc}(\mathbf r)\, n(\mathbf r)\, d\mathbf r + E_\mathrm{xc}[n] + E_{NN},
$$

where $E_{NN}$ is the repulsion between the fixed nuclei.

For comparison, [Hückel theory](./benzene-pi-orbitals-huckel.html) also solves a one-electron eigenvalue problem, but its Hamiltonian is fixed in advance by two parameters. In Kohn–Sham theory the Hamiltonian depends on the density it produces, which is why the equations have to be solved iteratively.

## The self-consistent field loop

1. Guess a density, for example a superposition of atomic densities.
2. Build the effective potential $v_\mathrm{ext} + v_\mathrm{H}[n] + v_\mathrm{xc}[n]$.
3. Solve the Kohn–Sham equations for the lowest orbitals. In a basis set this becomes a matrix eigenvalue problem.
4. Build a new density from the occupied orbitals.
5. Mix the new density with the old one rather than replacing it outright, which damps oscillations. Simple linear mixing works for easy cases; codes use extrapolation schemes such as Pulay's DIIS (common in molecular codes, applied to the Kohn–Sham matrix) or Broyden-type density mixing (used in Quantum ESPRESSO).
6. Repeat from step 2 until the energy and density stop changing within a set threshold.

A geometry optimisation wraps a second loop around this one: converge the SCF, compute forces on the nuclei, move them, and converge again.

## Jacob's ladder of functionals

Perdew and Schmidt arranged approximations to $E_\mathrm{xc}$ as the rungs of a ladder [5]. Each rung adds one more ingredient, and with it more physics and more cost.

| Rung | Ingredients | Examples |
|---|---|---|
| Local density approximation (LDA) | $n(\mathbf r)$ | Slater exchange with VWN correlation |
| Generalised gradient approximation (GGA) | $n$, $\nabla n$ | PBE, BLYP |
| Meta-GGA | $n$, $\nabla n$, kinetic energy density $\tau$ | TPSS, SCAN |
| Hybrid | a GGA or meta-GGA plus a fraction of exact exchange from occupied orbitals | B3LYP, PBE0 |
| Fifth rung | unoccupied orbitals as well | double hybrids, random-phase approximation |

### LDA

The LDA treats each point of the molecule as if it were a uniform electron gas at the local density:

$$
E_\mathrm{xc}^\mathrm{LDA} = \int n(\mathbf r)\, \varepsilon_\mathrm{xc}^\mathrm{unif}\!\left(n(\mathbf r)\right) d\mathbf r .
$$

The exchange part is known exactly, $E_\mathrm{x}^\mathrm{LDA} = -\tfrac34 \left(\tfrac{3}{\pi}\right)^{1/3} \int n^{4/3}\, d\mathbf r$, where the constant is 0.7386 for a spin-unpolarised density. The correlation part comes from quantum Monte Carlo calculations on the uniform gas [6], fitted to analytic forms such as that of Vosko, Wilk and Nusair [7]. LDA works surprisingly well for solids with slowly varying densities but overbinds molecules.

### GGA, for example PBE

A GGA also uses the gradient of the density. Exchange is written as the LDA value times an enhancement factor that depends on the reduced gradient $s = |\nabla n| / (2 k_F n)$, with $k_F = (3\pi^2 n)^{1/3}$. In PBE [8]

$$
F_\mathrm{x}(s) = 1 + \kappa - \frac{\kappa}{1 + \mu s^2/\kappa}, \qquad \kappa = 0.804, \quad \mu = 0.21951 .
$$

Neither constant is fitted to molecular data. $\kappa$ is set by the Lieb–Oxford bound on the exchange energy, which caps $F_\mathrm{x}$ at $1 + \kappa = 1.804$, and $\mu$ is chosen so that for slowly varying densities the gradient terms of exchange and correlation cancel, keeping the LDA's correct linear response. PBE is the usual default for solids in plane-wave codes.

### Hybrids, for example B3LYP

Hartree–Fock exchange, evaluated with the Kohn–Sham orbitals, is exact for exchange but pairs badly with approximate correlation. Becke showed that mixing a fraction of it into a GGA improves thermochemistry, and proposed a three-parameter form fitted to the atomisation energies, ionisation potentials, proton affinities and total atomic energies of a standard test set [9]:

$$
E_\mathrm{xc} = E_\mathrm{xc}^\mathrm{LSDA} + a_0 \left( E_\mathrm{x}^\mathrm{exact} - E_\mathrm{x}^\mathrm{LSDA} \right) + a_\mathrm{x}\, \Delta E_\mathrm{x}^\mathrm{B88} + a_\mathrm{c}\, \Delta E_\mathrm{c}^\mathrm{PW91},
$$

with $a_0 = 0.20$, $a_\mathrm{x} = 0.72$ and $a_\mathrm{c} = 0.81$. Here $\Delta E_\mathrm{x}^\mathrm{B88}$ is Becke's 1988 gradient correction to exchange [10]. B3LYP keeps the same three numbers but replaces the PW91 correlation with that of Lee, Yang and Parr (LYP) [11, 12]. LYP is a complete correlation functional rather than a correction to the local one, so the local part is mixed in separately. As Gaussian implements it [13],

$$
E_\mathrm{xc}^\mathrm{B3LYP} = 0.80\, E_\mathrm{x}^\mathrm{Slater} + 0.20\, E_\mathrm{x}^\mathrm{HF} + 0.72\, \Delta E_\mathrm{x}^\mathrm{B88} + 0.81\, E_\mathrm{c}^\mathrm{LYP} + 0.19\, E_\mathrm{c}^\mathrm{VWN} .
$$

Gaussian uses Vosko–Wilk–Nusair functional III for the local correlation, while some other programs use functional V, so B3LYP energies from different codes can differ slightly. The exact-exchange term depends on the orbitals, not just the density, so it is a non-local operator and costs more than a GGA.

## Basis sets and plane waves

The Kohn–Sham orbitals have to be expanded in some set of functions, and the two programs I use make different choices.

**Gaussian: atom-centred Gaussian basis sets.** Each orbital is a combination of Gaussian functions $x^a y^b z^c e^{-\alpha r^2}$ centred on the atoms. The functions follow the molecule, so a small number of them describes a molecule well, all electrons can be treated explicitly for light atoms (with effective core potentials available for heavy ones), and the integrals needed for exact exchange have closed forms, which makes hybrid functionals routine. The quality is improved by moving to larger basis sets, and because each atom's functions also help describe its neighbours, interaction energies carry a basis-set superposition error that has to be checked.

**Quantum ESPRESSO: plane waves with pseudopotentials.** For a periodic crystal, Bloch's theorem writes each orbital as $e^{i\mathbf k \cdot \mathbf r}$ times a function with the period of the lattice, and that function is expanded in plane waves $e^{i\mathbf G \cdot \mathbf r}$ over the reciprocal lattice vectors $\mathbf G$. All plane waves with $\tfrac12 |\mathbf k + \mathbf G|^2 \le E_\mathrm{cut}$ are kept, so a single number controls the quality of the basis and there is no superposition error [14]. The price is that the sharp orbitals near a nucleus would need an enormous cutoff. Pseudopotentials (norm-conserving or ultrasoft) and the closely related projector augmented-wave (PAW) method remove the core electrons and smooth the valence orbitals inside a core radius, which brings the cutoff down to something practical. The Brillouin zone has to be sampled with a grid of $\mathbf k$ points, molecules have to be placed in a box with enough vacuum to separate them from their periodic images, and exact exchange is much more expensive than with Gaussian functions, which is one reason GGAs such as PBE dominate plane-wave work.

## Where this meets my own work

I used B3LYP in Gaussian for a DFT study of the vanadium complex [VO(SALIEP)(DTP)] as a water-reducing catalyst, with Dr. Soumyajit Roy. The work is in preparation, so there are no results to report here. A single molecular complex is the case that atom-centred basis sets and hybrid functionals suit well, while periodic solids belong to the plane-wave side. Longer derivations of these steps, including the Hartree–Fock background that the hybrids borrow from, are in the [DFT notes](https://shuvam-banerji-seal.github.io/DFT-notes/).

## References

1. M. Born and R. Oppenheimer, "Zur Quantentheorie der Molekeln", *Annalen der Physik* 389, 457–484 (1927). https://doi.org/10.1002/andp.19273892002
2. P. Hohenberg and W. Kohn, "Inhomogeneous Electron Gas", *Physical Review* 136, B864–B871 (1964). https://doi.org/10.1103/PhysRev.136.B864
3. M. Levy, "Universal variational functionals of electron densities, first-order density matrices, and natural spin-orbitals and solution of the v-representability problem", *Proceedings of the National Academy of Sciences USA* 76, 6062–6065 (1979). https://doi.org/10.1073/pnas.76.12.6062
4. W. Kohn and L. J. Sham, "Self-Consistent Equations Including Exchange and Correlation Effects", *Physical Review* 140, A1133–A1138 (1965). https://doi.org/10.1103/PhysRev.140.A1133
5. J. P. Perdew and K. Schmidt, "Jacob's ladder of density functional approximations for the exchange-correlation energy", *AIP Conference Proceedings* 577, 1–20 (2001). https://doi.org/10.1063/1.1390175
6. D. M. Ceperley and B. J. Alder, "Ground State of the Electron Gas by a Stochastic Method", *Physical Review Letters* 45, 566–569 (1980). https://doi.org/10.1103/PhysRevLett.45.566
7. S. H. Vosko, L. Wilk and M. Nusair, "Accurate spin-dependent electron liquid correlation energies for local spin density calculations: a critical analysis", *Canadian Journal of Physics* 58, 1200–1211 (1980). https://doi.org/10.1139/p80-159
8. J. P. Perdew, K. Burke and M. Ernzerhof, "Generalized Gradient Approximation Made Simple", *Physical Review Letters* 77, 3865–3868 (1996). https://doi.org/10.1103/PhysRevLett.77.3865
9. A. D. Becke, "Density-functional thermochemistry. III. The role of exact exchange", *Journal of Chemical Physics* 98, 5648–5652 (1993). https://doi.org/10.1063/1.464913
10. A. D. Becke, "Density-functional exchange-energy approximation with correct asymptotic behavior", *Physical Review A* 38, 3098–3100 (1988). https://doi.org/10.1103/PhysRevA.38.3098
11. C. Lee, W. Yang and R. G. Parr, "Development of the Colle-Salvetti correlation-energy formula into a functional of the electron density", *Physical Review B* 37, 785–789 (1988). https://doi.org/10.1103/PhysRevB.37.785
12. P. J. Stephens, F. J. Devlin, C. F. Chabalowski and M. J. Frisch, "Ab Initio Calculation of Vibrational Absorption and Circular Dichroism Spectra Using Density Functional Force Fields", *Journal of Physical Chemistry* 98, 11623–11627 (1994). https://doi.org/10.1021/j100096a001
13. Gaussian, Inc., "Density Functional (DFT) Methods", Gaussian 16 user's reference. https://gaussian.com/dft/
14. P. Giannozzi et al., "QUANTUM ESPRESSO: a modular and open-source software project for quantum simulations of materials", *Journal of Physics: Condensed Matter* 21, 395502 (2009). https://doi.org/10.1088/0953-8984/21/39/395502
