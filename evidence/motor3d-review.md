# Three flight modes in the kitchen

The motor laboratory's three-way comparison is now available in the main 3D game. The new six-output policy is trained for the current XYZ/quaternion dynamics; the old planar readout is not reused.

## Verification

- `npm test`: 53 passing tests, including learned recipe completion, live mode switching, zeroed readouts, real blade contact, retraining recovery, readout validation, anatomical-data immutability, and rigid grip coupling.
- `npm run motor:gameplay`: 3/3 recipes, 28/28 two-fly crews, zero attachment drift; zero-output controls cannot lift or cut from the rest.
- `npm run motor:benchmark`: learned and autopilot each settle all 28 regular and 14 stress trajectories. Untrained, clamped-KC and permuted-KC controls settle none. See the JSON for seeds, errors and the definition of each stress case.
- Browser: pretrained lesson loads; learned mode reaches the ready state; erasing weights removes thrust and disables Chop as the knife falls; browser-worker training restores the lesson; reload reads the saved policy; restore reloads the shipped lesson. No browser console errors observed.
- Responsive review: ordinary desktop layout, 390 × 844 phone layout, phone viewport fullscreen fallback, and 844 × 390 landscape fullscreen fallback. Brain source, controller selector, exit, menu and chop controls remain reachable. Native fullscreen behavior is retained from the existing fullscreen implementation.

The readiness regression was reproduced before the fix: immediately after erasure, the knife briefly still met the settling threshold and re-entered ready, then remained ready while falling. Ready now checks physical settlement continuously. A regression waits one second after erasure without pressing Chop, requires lift state and rejects Chop, then retrains and completes that same order.

## Interpretation

Training imitates a simple analytic teacher through fixed anatomical features. All eight chefs receive copies of a shared fitted lesson. It does not establish that biological wiring is superior, reproduce insect aerodynamics, or train the authored perch approach/return splines. Smell learning and flight readouts are independent; only flight readouts and the rush high score persist across reloads.

The immutable `data/circuit.json` retains SHA-256 `e00582e5d828d727f89325ff9e662176179ef2268460dbbfedb1a1cfc7d0b9d1`.
