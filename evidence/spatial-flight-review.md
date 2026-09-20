# Spatial flight and live Brain panel — v1.3

## Simulation checks

`npm test`: **41 passed, 0 failed**. The nine new checks cover:

- Eight stationary perches spanning more than 3 units of depth and 5 units of height.
- The knife stays parked until every recruited chef reaches its grip.
- Real changes in flight and knife world Z, not just screen-space animation.
- Zero attachment drift through pickup, rotation, chopping and return.
- Scene-graph carrier world positions match simulation positions; attached meshes share the knife rig parent.
- A downward blade passing behind a fruit does not cut it.
- Bounded 3D forces/torques, normalized orientation and no target-position teleport.
- Live neural activity approaches the selected fly's learned response and decays with no cue.
- Sniffing activates only its recipient without changing learned strengths.

`npm run salad:benchmark`: **3/3 recipes** and **28/28 two-chef combinations** completed. The knife moved through **1.8043 units of depth**, with **0 maximum attachment-position error** in every recorded completed trial. Clearing learning blocked recruitment; retraining restored it. All three recipes scored 680 with programmatically supplied perfect timing. Durations were 30.80 s (Sunshine), 30.89 s (Berry) and 29.55 s (Green). Raw results are in `salad-results.json`.

## Browser checks

Verified in the in-app WebGL browser:

- Flies visibly rest on the window sill, jars, mug, shelves and opposite counter edges.
- Recruited chefs approach from separate locations; the knife waits, then carries them together.
- The in-frame Brain box shows a rotatable point cloud, selected chef, perch/carry state, active-KC count and MBON output.
- Pip's apple output reached **1.13**. Selecting Zest changed the displayed apple output to **0.44** and his location to Marmalade jar; his orange output reached **1.20** after the ingredient change. Dot's strawberry output reached **1.17**.
- Apple and orange chops increased the score, and the next fruit recruited its own crew. Arrow-key rotation of the Brain cloud worked.
- Desktop and 390-pixel phone layouts were visually checked. On desktop the inset is at the top right of the game frame. On phones it is a rectangle below the scene, inside the same game frame, without covering the chop controls.
- Browser error/warning log was empty during the inspected flow.

The displayed glows represent modeled rates, not measured spikes. Neuron layout is schematic; neuron identities and graph edges come from the extracted circuit. Free fly approaches are authored 3D paths, and knife grips are ideal rigid constraints. No biological flight or whole-brain validation is claimed. The earlier planar browser review remains in `salad-review.md` for history.
