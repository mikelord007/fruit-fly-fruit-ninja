# Fruit Fly Fruit Ninja — the tiniest salad bar

A playable Three.js kitchen: choose a fruit salad, recruit flies through their learned tastes, and time a chop with their shared knife. Teach them a new taste and a different crew volunteers.

**Play online: https://fruit-fly-fruit-ninja.vercel.app**

## Play

Requires Node.js 22+ and a WebGL-capable browser. No package install, API key or internet connection is needed. Double-click `launch.cmd`, or:

```powershell
npm start
```

Open **http://127.0.0.1:5184**. The server listens only on your computer. Keep its terminal running.

1. Order **Sunshine bowl**. Apple fans fly out and lift the knife.
2. Hit **Chop** or **Space** when the timing marker reaches the green zone. The moving blade must physically touch the fruit.
3. Repeat for orange and strawberry; each ingredient recruits its own crew. Finish the bowl for a bonus.
4. Order **Green surprise**. Nobody knows kiwi yet. In **Taste school**, select two chefs and teach kiwi. Their connections strengthen, they volunteer, and the waiting order continues.
5. Try a **90-second rush**, make a custom mix, or open the brain inspector and clear learning to see volunteering disappear.

Drag the scene to orbit, scroll to zoom, and click a fly or chef card to select it for training. Sound is optional. Learned tastes last until page reload; the best rush score stays in local storage. Tab hiding pauses the simulation. Canceling an order returns to the menu while keeping earned points and the remaining rush time.

## Learning, honestly

The game uses an immutable real connectome extraction (319 neurons, 2,117 edges). Synthetic odors pass through anatomical PN → KC connections; each chef has independent plastic KC → MBON strengths. Starter favorites are acquired through recorded training. Teaching changes eligible connections, which changes volunteering.

The snack-learning rule is an **engineered appetitive extension**; it is not the original aversive PPL1 learning model. The motor controller is conventional physics control. The game is rendered in 3D with planar knife dynamics; food halves and plating use contact-triggered animation. It makes no claim of improving human neuroplasticity. See [GAME_MODEL.md](GAME_MODEL.md) for equations, assumptions and limits, and [DATA_PROVENANCE.md](DATA_PROVENANCE.md) for data attribution.

The original learned-motor laboratory remains at **/lab.html**, with its Canvas fallback at **/index2d.html**. Its measured benchmarks and model card are unchanged and apply only to that laboratory. See [LAB_README.md](LAB_README.md).

## Deploy

The project is hosted on Vercel as a static site and connected to its GitHub repository. Production deployments use `vercel.json`; no server process, build step, or package installation is needed on the host. To deploy from an authenticated Vercel CLI, run `vercel deploy --prod`. Local environment files and Vercel account metadata are excluded from uploads, Git and the download package.

## Verify

```powershell
npm test
npm run salad:benchmark
```

The current suite includes 32 tests. Salad checks cover selective plasticity, reset/retraining, anatomical wiring sensitivity, contact detection, all 28 two-chef combinations, all recipes, timing and rush expiration. Recorded simulation results are in `evidence/salad-results.json`; browser verification is in `evidence/salad-review.md`.

For the original lab: `node scripts/physics-benchmark.mjs` and `npm run experiment`.

## Main files

- `src/fruit-memory.js`: odor inputs, anatomical feature circuit and independent plastic strengths.
- `src/salad-game.js`: recruitment, phase transitions, physical knife contact and scoring.
- `src/salad-scene.js`: kitchen, flies, knife, fruit halves, camera and visual effects.
- `src/salad-app.js`, `index.html`, `salad.css`: playable interface and brain inspector.
- `src/physics.js`: shared force-limited rigid-body simulator and engineering motor controller.
- `lab.html`, `src/app.js`, `src/neural.js`: preserved motor-learning lab.
- `vendor/three/`: locally bundled Three.js 0.186.0, MIT licensed.

Code: MIT. Anatomical data: CC BY 4.0, credited to FlyEM at HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology and Google Research. See `LICENSE`, `THIRD_PARTY_LICENSE` and `DATA_PROVENANCE.md`.
