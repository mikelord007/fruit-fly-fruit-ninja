# Learned navigation and physical banking

The kitchen now applies its learned force/torque readout to each free fly's own body state, from its perch to a knife grip and back. Position and attitude are integrated at 120 Hz. The coordinator supplies spatial waypoints, desired banking and grip assignments; it does not animate position along a timeline. This is simplified physical control with engineered navigation goals, not learned obstacle planning or biological insect flight.

The existing mass/inertia-normalized readout transfers to the lighter free-fly body. Its weights, encoding and storage key remain compatible with existing lessons, including deliberate erasure. The shipped policy's scope metadata is updated; numerical weights are unchanged. Transport banking is driven by torque toward a state-dependent attitude target. Chop readiness requires the knife to level and settle.

Validation:

- All 61 automated tests pass, including the original lab and kitchen tests.
- All 8 flies reach assigned grips and return to their separate perches under learned control.
- Erased weights, Untrained mode, missing policy and clamped KCs produce zero free-flight thrust, with no timed arrival or teacher fallback.
- Erasing one chef's readout blocks that chef while its trained crew mates arrive; restoring it recovers the same order.
- A displaced fly changes its neural action and reacquires its grip. A gust disrupts the knife, temporarily blocks chopping, and is corrected before a real blade-contact cut.
- All 3 recipes and all 28 two-fly crews complete in `motor3d-gameplay.json`; maximum carrier/grip drift is zero. Zero-output controls complete no cuts.
- Browser inspection confirmed live PN/KC activity during recruitment, learned navigation copy, a physical gust and recovery, an actual scored slice, and no console errors. The existing saved flight lesson loaded successfully.

Short trails show measured free-flight positions. The inspected active fly's arrow shows applied force. These displays do not alter physics. The Gust of wind button is inside Train & inspect flight and changes velocities rather than pose.

Shelf geometry is not a general obstacle-collision model. Departure and arrival waypoints provide simple clearance; the worktop supplies a floor contact. Docking uses small position/speed/orientation thresholds and an ideal grip constraint. These software tests are not biological validation.
