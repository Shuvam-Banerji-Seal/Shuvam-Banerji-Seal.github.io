---
title: "Molecule3D: a LAMMPS workbench that runs in your browser"
description: What Molecule3D (LAMMPS Web GUI) does, who it is for, and what a first session looks like, from a starter script to a trajectory and its RDF.
date: 2026-11-17
tags: [Molecular dynamics, LAMMPS, Software]
slug: molecule3d-lammps-in-the-browser
---

Molecule3D is a workbench for LAMMPS, the molecular dynamics code from Sandia National Laboratories [1], that runs entirely in a web browser. Its repository and live app go by the name LAMMPS Web GUI. I built it so that someone meeting LAMMPS for the first time can write an input script, run it, look at the atoms and analyse the trajectory without installing anything. It is live at [shuvam-banerji-seal.github.io/lammps-web-gui](https://shuvam-banerji-seal.github.io/lammps-web-gui/) and the source is at [github.com/Shuvam-Banerji-Seal/lammps-web-gui](https://github.com/Shuvam-Banerji-Seal/lammps-web-gui).

## Who it is for

LAMMPS is driven by a text input script that it reads from top to bottom, one command per line [2]. The order matters. `units`, `dimension`, `boundary` and `atom_style` have to come before the simulation box exists, while `pair_coeff`, `mass`, `velocity` and `create_atoms` only make sense after it. Some mistakes stop LAMMPS with an error; others run quietly and produce nonsense, such as a `run` with no time-integration fix, in which the atoms never move. On top of the input language, a newcomer has to compile LAMMPS with the right packages and then open the output in a separate visualisation program.

Molecule3D puts those steps in one browser tab. It is aimed at students in their first weeks with LAMMPS, and at anyone who wants to check a script or look at a trajectory on a machine where nothing is installed. It is not a replacement for native LAMMPS on a cluster, and the limits section below says where it stops.

## The four modules

| Module | What it does |
|---|---|
| Script Builder | Builds an input script as a flowchart of commands, checks it against the LAMMPS rules, and imports existing `in.*` files |
| MD Notebook | Runs LAMMPS input typed into notebook cells, with a thermo table, live charts and a 3D view |
| Structure Viewer | Opens structures and trajectories in 3D, plays them back, measures geometry and computes RDF and MSD |
| Compiler Helper | Turns a choice of packages and accelerators into a CMake build script for native LAMMPS |

### Script Builder

The Script Builder draws an input script as a flowchart. Its library has 185 commands, the general commands in the official LAMMPS command index, and a test diffs that list against the live `docs.lammps.org/Commands_all.html` page [3] so that the library cannot quietly drift from the manual. Free-form `fix`, `compute` and `dump` steps cover styles without their own editor. Cards can be dragged between other cards, and the script is written out in exactly the order the flowchart shows, so multi-stage scripts (a `run`, a `reset_timestep`, a second `run`) come out the way they were drawn.

A script check reads the final script, whether generated or edited by hand, and flags what LAMMPS would reject or silently get wrong: header commands used after the box exists, box-dependent commands used before it, `unfix` of an ID that was never defined, a `run` with no integrator, `pair_style reaxff` without charge equilibration, and mismatched kspace and pair styles. Every rule quotes the `docs.lammps.org` page it enforces and links to it.

An existing `in.*` file can be imported. Recognised commands become editable cards, and lines the parser does not recognise are kept verbatim as raw steps, so nothing is lost on the way in. A flowchart can be forked into alternative "concepts" (a different thermostat, say) and exported as an SVG or PNG diagram.

### MD Notebook

The notebook runs LAMMPS input in the browser. Its engine is written in TypeScript and computes forces either on the GPU through WebGPU or on CPU threads through Web Workers; an Auto setting picks one and the side panel says why. While a cell runs, the thermo output fills a table and live charts, and the atoms move in a 3D view.

Because the engine is a reimplementation, the obvious question is whether it agrees with LAMMPS. The project's README [4] answers with numbers. The engine is compared with native LAMMPS built from the same source commit on 2,736 parity cases, covering thermo output and per-atom positions, velocities and forces, at a relative tolerance of $10^{-8}$ or tighter in most cases. Of the 894 input scripts in the LAMMPS `examples/` tree, 702 run in the browser (with runs shortened to a few steps). A command that is not supported stops the run with an error naming the line and the command, rather than being skipped.

### Structure Viewer

The viewer reads LAMMPS data files (all 23 documented `read_data` atom styles), LAMMPS dump trajectories, XYZ including extended XYZ, PDB and CIF. For dumps it understands all four coordinate forms (`x y z`, `xu yu zu`, `xs ys zs`, `xsu ysu zsu`) and a box that changes from frame to frame, so a cell that breathes under a barostat is drawn as it is. Trajectories play back at 2 to 30 frames per second and can be recorded as MP4 or WebM at up to 60 frames per second. Clicking two, three or four atoms gives a distance, angle or dihedral; in a periodic cell the atoms are joined through their nearest periodic images.

The Analysis tab computes, for a dump trajectory, the radial distribution function $g(r)$ and the mean squared displacement with periodic boundaries handled, density profiles, and speed histograms when velocities are present. Each chart exports to CSV. The analysis runs in a Web Worker, and its unit tests check physics rather than appearance: $g(r) \to 1$ for a random gas, the first two shells of a simple cubic lattice at $a$ and $a\sqrt2$, an MSD of exactly $(vt)^2$ under uniform drift, and zero MSD for a frozen structure. What those two quantities mean, and how to compute them correctly, is the subject of [a separate note on RDF and MSD](./rdf-and-msd-from-md-trajectories.html).

### Compiler Helper

When a student moves to native LAMMPS on a workstation or cluster, they have to build it. The Compiler Helper lists 46 CMake build options (FFT and heFFTe back ends, OpenMP, Kokkos, the GPU package's API, precision and architecture, FFMPEG and others), each with a description taken from the LAMMPS build documentation, plus the 71 packages of the `most.cmake` preset and the GPU, INTEL and KOKKOS packages. Picking packages and accelerators produces a CMake build script ready to run.

## A first session

Here is a sequence that uses only what the app provides.

1. **Open the app.** There is no account and nothing to install. Bundled examples (C60, benzene, rock-salt NaCl and a water cluster) can be opened straight away in the viewer.
2. **Load a starter template.** In the Script Builder, the "Lennard-Jones fluid (NVT)" template builds a complete pipeline: `units lj`, an fcc lattice at reduced density 0.8442 filling a box of 10 × 10 × 10 unit cells (4,000 atoms), velocities drawn at $T^{\ast} = 1.0$, `pair_style lj/cut 2.5`, `fix nvt` at $T^{\ast} = 1.0$, a `dump custom` of `id type x y z vx vy vz`, and a run of 50,000 steps. The script check is clean: every template is tested to generate zero errors and zero warnings.
3. **Make a mistake on purpose.** Drag `pair_coeff` above `create_box`. The check flags it and links to the page of the manual that explains why. It is a quick way to learn the ordering rules.
4. **Adjust the dump before running.** The template dumps wrapped coordinates `x y z` without image flags. An MSD needs continuous paths, so if the dump is going to the Structure Viewer, add `ix iy iz` to the dump fields or dump `xu yu zu` instead. Without them the viewer can only use the minimum-image convention, whose MSD flattens near $(L/2)^2$, about $70\,\sigma^2$ for this box of side $16.8\,\sigma$; its Analysis tab states which mode it is using. For a first look it also helps to shorten the run.
5. **Run it.** "Run in Notebook" sends the script to the MD Notebook. Press Run and watch the temperature column of the thermo table settle near the thermostat's set point while the atoms move in the 3D view.
6. **Analyse.** The notebook has its own analysis panel: MSD, $g(r)$, density and speeds, plus coordination numbers, bond-angle distributions and the structure factor $S(q)$, each exportable as SVG, PNG and CSV. Its MSD counts image flags from the recorded frames itself, which works as long as no atom moves more than half a box between two recorded frames. The notebook also lists the files the run wrote, and the dump can be opened in the Structure Viewer to play it back, measure distances and angles, and record a video.

The same steps work the other way round: a script written in the notebook opens in the Script Builder with "Open in Script Builder", which gives it a flowchart and a script check.

## Nothing leaves the browser

There is no backend. Parsing, script generation, the script check, the MD engine and the trajectory analysis all run on the user's own machine, and no file is uploaded. The script pipeline, the compiler options, the active module and the colour theme are kept in the browser between visits, and a storage drawer lists the files kept in the browser's IndexedDB so they can be previewed, downloaded or deleted.

## How it is built

The app is written in TypeScript with React 19. The 3D views use three.js through React Three Fiber, with atoms and bonds each drawn as a single instanced draw call, and file parsing and analysis run in two Web Workers so the interface does not freeze on large files. It is built with Vite and Tailwind CSS. The test suite, run with Vitest, has more than 3,000 tests, including parsers, the command catalogue, script import and the native-LAMMPS parity cases. Every change goes through GitHub Actions (type check, tests, dependency audit, build and a bundle-size budget) before it is deployed to GitHub Pages.

## Limits

- Not every LAMMPS feature runs. Features that need native libraries or separate processes, such as KIM, Python, MPI partitions beyond the notebook's NEB partitions, and external codes, are out of scope and stop with an error that says so.
- Speed is below native LAMMPS. Some examples still run up to about five times slower than single-threaded native LAMMPS, so production runs belong on a native build, which is what the Compiler Helper is for.
- `dump movie` is not supported, because there is no video encoder in the browser; `dump image` frames are.

## Licence

The source is public under the LAMMPS Web GUI Educational and Non-Commercial Source-Available Licence. It is free for teaching, coursework, theses and academic research, with attribution, and commercial use needs written permission. Releases made before 22 September 2026 were MIT-licensed and keep that licence. Styles ported from the LAMMPS C++ source sit in a separate GPL-2.0 module, and the project is independent of, and not endorsed by, the LAMMPS developers.

## References

1. A. P. Thompson, H. M. Aktulga, R. Berger, D. S. Bolintineanu, W. M. Brown, P. S. Crozier, P. J. in 't Veld, A. Kohlmeyer, S. G. Moore, T. D. Nguyen, R. Shan, M. J. Stevens, J. Tranchida, C. Trott and S. J. Plimpton, "LAMMPS: a flexible simulation tool for particle-based materials modeling at the atomic, meso, and continuum scales", *Computer Physics Communications* 271, 108171 (2022). https://doi.org/10.1016/j.cpc.2021.108171
2. LAMMPS documentation, "Input script structure". https://docs.lammps.org/Commands_structure.html
3. LAMMPS documentation, "All commands". https://docs.lammps.org/Commands_all.html
4. S. Banerji Seal, LAMMPS Web GUI (Molecule3D), source code and README. https://github.com/Shuvam-Banerji-Seal/lammps-web-gui
5. S. Banerji Seal, LAMMPS Web GUI, live application. https://shuvam-banerji-seal.github.io/lammps-web-gui/
