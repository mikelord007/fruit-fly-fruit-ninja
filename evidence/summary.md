# Measured evidence

| Controller | Held-out grid | Harder stress cases | All cases |
|---|---:|---:|---:|
| Learned PN→KC readout | 17/20 | 0/4 | 17/24 |
| Untrained / learning disabled | 0/20 | 0/4 | 0/24 |
| Reset learned memory | 0/20 | 0/4 | 0/24 |
| Neural features clamped | 0/20 | 0/4 | 0/24 |
| KC features permuted after training | 0/20 | 0/4 | 0/24 |
| Analytic PD teacher | 20/20 | 4/4 | 24/24 |
| Direct affine observation readout | 0/20 | 0/4 | 0/24 |

All variants use matched initial conditions, 120 Hz physics, 12 simulated seconds, two identical seeded gusts, and frozen learned parameters. Every trial and distance/tilt distribution is in `experiment-results.json`. No run produced a non-finite physical state. The 20 held-out cases form a structured grid within training ranges with fresh gust seeds; this is not an IID population estimate. Four explicit extrapolation cases test larger masses, steeper tilts and two missing flies together.

The linear comparator uses a different training protocol. The post-training permutation is not a retrained random-wiring baseline. These results show acquired control and dependence on neural features, **not special superiority of the anatomical wiring**.

Training: 2,400 examples per fly, 386 fitted parameters per fly, ridge penalty 0.001, normalized-force MSE 0.001251335. Measured training time was about 0.91 seconds; the seven-variant benchmark took about 55.9 seconds. Timings depend on the machine and browser.

The independent engineering physics sweep in `physics-results.json` passes 20/20 scenarios with 0–2 flies removed and a gust. All applied force magnitudes stay at or below 8 normalized units. Sixteen unit tests cover gravity, moment arms, force bounds, contacts, deterministic resets, target-independent physics, timestep convergence, mass/inertia consistency, fixed anatomical normalization, separate agent state, deterministic training, serialization and ridge numerical stability.

Reproduce from the project folder:

```powershell
npm test
node scripts/physics-benchmark.mjs
npm run experiment
```

Data integrity: the copied circuit JSON SHA-256 is `e00582e5d828d727f89325ff9e662176179ef2268460dbbfedb1a1cfc7d0b9d1`, matching its original extraction provenance.
