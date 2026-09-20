# Fly Swarm Kitchen

Eight tiny virtual flies, one shared load, and a very serious pea delivery service.

Now rendered in **Three.js/WebGL**: orbit the kitchen, zoom in on the crew, inspect volumetric flies and their force arrows, and watch the load cast shadows across the countertop. Three.js is bundled locally, so the scene works offline.

Measured result: learned control passed **17/20 held-out cases**, but **0/4 harder stress cases**. The engineering teacher passed all 24. Resetting or clamping neural activity passed none. The original anatomy is fixed; only added force readouts learn. See `evidence/summary.md` for the full comparison and its limits.

## Run locally

Requires Node.js 22 or newer. No package installation, account, API key or GPU is needed. Double-click `launch.cmd`, or run from this folder:

```powershell
npm start
```

Open http://127.0.0.1:5184. The server listens only on loopback. Keep its terminal running; Ctrl+C stops it. If the port is already occupied, the launcher prints an error instead of stopping another project. Internet access is not required for the simulation.

## Try it

Start with **Lift & Balance** and the engineering autopilot. Switch to **Carry a Pea**, move the goal, change the mass, apply a gust, or select a fly and remove it. Watch each force arrow and the beam's tilt. Pause to inspect the scene.

Drag the scene to orbit, scroll/pinch to zoom, and double-click to place the goal on the simulation plane. Click a fly to select it. Camera buttons provide overview, front and crew views; arrow keys on the focused scene move the goal. If WebGL is unavailable, open `index2d.html` for the original Canvas view. Both interfaces use the same controllers and data.

Compare **Learned action readout** with **Untrained / learning disabled**. Train from the engineering teacher, then reset learned memory to remove that policy. The anatomical graph remains unchanged. The judge test reports actual physical outcomes rather than a scripted victory.

A measured pretrained readout ships with the app. New training runs in a Web Worker and saves locally in the browser when storage is available. The judge freezes the setup, applies a deterministic gust and offers a reproducible replay. Ordinary Restart scenario returns to the mission's initial state; it is not a recording of arbitrary manual interventions.

The illustrated pea is part of the beam's total load. Delivery means holding that load at the goal, rather than dropping a separately simulated pea onto a colliding plate. All forces, masses, lengths and times are normalized simulation values, not measured fly capabilities.

**3D display, planar physics:** objects and camera are genuinely three-dimensional, while the proven rigid-body experiment still uses x/y translation and one rotation axis. This update does not claim new free-flight dynamics or retrain a three-axis controller.

## Reproduce the evidence

```powershell
npm test
node scripts/physics-benchmark.mjs
npm run experiment
```

`evidence/physics-results.json` records 20 baseline trials, including every initial condition and outcome. `evidence/experiment-results.json` records the neural comparison and held-out trials; `evidence/trained-session.json` stores fitted readouts separately from the original anatomical data. Experiments run headlessly with deterministic fixed simulation steps.

## What the experiment does and does not show

This is a rigid-body control experiment using a small real connectome subgraph as an engineered feature transform. The neural controller learns added force-output weights from an autopilot teacher. It does not learn anatomical synaptic strengths, reproduce biological motor outputs, or establish that real wiring is better than a simpler controller. No smell-learning circuit is presented as a ready-made flight controller.

Read `MODEL_CARD.md`, `DATA_PROVENANCE.md`, and the evidence files before interpreting the results. The original anatomical JSON is copied unchanged from the licensed MaleCNS extraction; no source project was edited.

The original build passed 16 unit tests plus a DOM/Canvas integration check. New scene-graph tests and actual WebGL browser checks cover the 3D update; see `evidence/3d-review.md`. `evidence/ui-review.md` is the historical 2D review. Use `DEMO_SCRIPT.md` for the measured 60-second pitch.

## Project map

- `src/physics.js`: bounded forces, moment arms, rigid-body integration, contacts, sensors and engineering baseline.
- `src/neural.js`: real fixed PN→KC topology, engineered encoding, per-fly readout learning and ablations.
- `src/app.js`, `index.html`, `style.css`: interactive kitchen and inspection controls.
- `src/scene3d.js`: Three.js geometry, lighting, picking and camera controls; it only reads physical state.
- `src/app2d.js`, `index2d.html`: preserved 2D fallback. `vendor/three/`: pinned Three.js 0.186.0 and MIT notice.
- `scripts/`: reproducible experiments. `tests/`: meaningful physics and controller checks.
- `data/`: immutable anatomy and exact provenance. `evidence/`: measured results and trained state.

Code: MIT. Anatomical data: CC BY 4.0, credited to FlyEM at HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology and Google Research. See LICENSE and THIRD_PARTY_LICENSE.
