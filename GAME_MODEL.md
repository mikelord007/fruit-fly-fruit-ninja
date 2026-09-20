# Fruit Fly Fruit Ninja: game model

Fruit Fly Fruit Ninja is a 3D salad game about learned preferences and learned flight and knife control. It is not a claim that real flies cooperate with knives or that playing improves human neuroplasticity.

## What the player changes

Eight chefs have independent simulated KC → MBON strengths. Synthetic apple, orange, strawberry and kiwi smells activate 124 projection-neuron inputs. Their activity travels through 1,362 anatomical PN → KC contacts to 192 Kenyon cells, with a simplified APL inhibitory loop and a top-15 sparsity rule. A fixed smell produces the same activity pattern in every chef; different training histories produce different preferences.

Every smell + snack pairing changes active KC → MBON strengths:

`new = old + 0.28 × KC activity × (1.5 × anatomical count − old)`

Initial strength is `0.2 × anatomical count`. The response is the weighted KC sum divided by the corresponding sum using anatomical counts. Chefs volunteer at response ≥ 0.72. A training click applies six pairings; changes persist for the current page session. Weights remain bounded. Inactive edges and unselected chefs do not change. The raw anatomical JSON is never modified.

This is an **engineered appetitive game rule**, not a validated physiological learning law. The extracted PPL101 → KC / KC → MBON11 compartment is associated with the original aversive model. The snack rule deliberately does **not** use its PPL1 pathway or relabel that aversive teaching signal as reward. Bidirectional learning, extinction, spiking dynamics, receptor identities and physiological units are not modeled.

The starter crew receives six recorded training pairings each: Pip/Basil/Fig learn apple; Zest/Miso/Boba learn orange; Dot/Bean learn strawberry. These are initialization histories, not immutable fruit assignments. Clearing learning removes all volunteers. Teaching new smells can produce multiple preferences and generalization because odors share active neurons. Kiwi begins untrained to make the causal effect visible during a short demo.

## What moves the knife

The recipe selects an ingredient; its learned response selects volunteers. At least two are required. An engineered coordinator distributes them across the grip. The salad game's rigid body now translates in X/Y/Z and rotates with a quaternion at 120 Hz. It uses mass 0.55, gravity, linear damping, worktop/boundary contacts and a force cap of 8 per fly. Engineered grip motors supply a bounded torque of 0.9 per fly. The selected flight mode generates these forces and torques, with an isotropic inertia approximation of `mass × 2.8² / 12`. These are simplified motor actuators, not fly aerodynamics. The original planar learned-motor experiments remain separately available in the physics lab; the kitchen now has its own newly fitted six-output 3D policy.

The knife has a rendered blade and matching collision edge from local x = −0.75 to 1.4, y = −0.16, z = 0. A cut requires downward speed greater than 0.25 and swept 3D edge contact with the spherical fruit proxy. The sweep interpolates XYZ position and quaternion orientation and subdivides at no more than 0.025 units of estimated edge travel. A blade passing behind the fruit cannot cut it. The timing meter determines a score bonus, never whether geometry is hit. A miss causes another lift. One contact awards one cut per ingredient.

The knife is integrated during lifting, waiting for the chop, cutting, plating and return. It parks on a rear knife rest while crews change. Flies begin on eight distinct perches: window sill, jar, mug, shelves and countertop edges at different depths. Each free fly has its own position, velocity, quaternion attitude and angular velocity, integrated at 120 Hz with mass 0.12 and inertia 0.008. Its learned readout supplies bounded XYZ force and torque from its own current state. The existing mass/inertia-normalized lesson transfers to these lighter bodies without replacing saved weights. An engineered coordinator chooses departure, approach and docking waypoints; no elapsed-time spline or automatic arrival timeout sets the flight position. Docking requires position, speed and attitude tolerances. Waypoints are not learned obstacle planning, and shelves are not general collision meshes. Recruitment cannot move the knife until every required carrier has arrived.

Attached flies use the knife's exact pose plus a fixed local grip offset. Their meshes become children of the knife rig; there is no separate carrier interpolation. Both simulation state and rendering are tested for zero relative attachment drift during movement and rotation. Grip constraints and the parked knife rest are idealized. Free flight is a simplified actuated rigid body, not insect aerodynamics.

Fruit halves, juice particles and their flight into the bowl are authored animations triggered by contact. They are not fracture mechanics or independently simulated food transport. Ingredients appear on the board between stages. Knife collision and motor dynamics determine the cut; decorative animation does not.

## Three flight modes

**Autopilot** uses the engineered XYZ position/velocity and quaternion-error PD controller. **Learned action readout** encodes 13 engineered relative-state observations into 124 PN units, passes them through the immutable 1,362 normalized PN → KC contacts and tanh activations, then reads six outputs from 192 KC features: XYZ force and XYZ rotation torque. **Untrained** keeps the state-derived neural features but makes all effective motor outputs zero. Missing learned policy data also produces zero output, never an autopilot fallback.

Flight training fits six ridge-regression outputs to 1,800 synthetic teacher states. A shared lesson is copied into eight separate readout arrays; this is not eight independently trained flight histories. The anatomical layer stays fixed. There is no readout intercept or direct observation bypass: clamping all KC features gives exactly zero force and torque. Shared actuator limits apply to every mode. The state encoding, signs, nonlinearities, training objectives and motor outputs are engineered; this is teacher imitation through anatomical features, not reconstruction of biological flight circuitry or evidence that this topology is optimal.

The player can switch controllers live, erase flight readouts, restore the shipped lesson, or train again in a Web Worker. Erasing flight learning automatically selects the zeroed learned controller. Training and restoring select learned mode. **Restart round** provides a fresh comparison from the knife rest without losing tastes or the flight lesson. A ready knife must remain physically settled; losing control disables chopping until it settles again. No artificial success timeout moves it into position.

Validated flight readouts, including deliberate erasure, persist in browser storage independently from taste memory. Saved policies must match the circuit IDs, contact-count hash, encoding version, and finite weight dimensions. The selected mode defaults to Learned action readout on reload, using the saved flight lesson when present or the shipped trained lesson otherwise. The Brain panel initially shows the flight circuit. Training can run while the game continues; the new lesson takes effect when fitting completes. Round resets and taste resets preserve the current flight mode and readout.

The selected motor policy controls both perch travel and the attached knife. During free flight, each fly runs its own observation through its own readout; while attached, carriers share the knife-body observation. The coordinator chooses waypoints, grips and desired banking attitude. Position error and velocity determine the bank target (capped at 0.6 radians per bank axis), but only integrated motor torque rotates the body. The knife banks during lifting and return, then levels for a cut. This makes acceleration, braking and recovery visible without decorative wobble. Zero or erased outputs cannot navigate to the knife; gravity still acts and the worktop supplies a floor contact. Restoring/training the lesson recovers the same active order.

**Gust of wind** in Train & inspect flight applies a physical velocity/angular-velocity impulse to flying chefs and the carried knife. The learned controller must correct it. Short trails record actual fly positions during free flight and attached knife carrying, and an arrow on the inspected active chef shows its applied force; neither changes motion.

## Live Brain panel

The inset contains all 319 circuit neuron identities and displays a subset of the actual connections. Its rotatable 3D layout is **schematic**, not measured soma coordinates or a whole-brain reconstruction. The visual direction was inspired by [Aimbug's Brain panel](https://aimbug.domi.zip/); no code, neuron positions, or artwork was copied.

In **Taste circuit** view, each fly has independent live PN/KC/APL/MBON rate state. The current ingredient broadcasts its synthetic odor cue; first-order filters approach the circuit's computed sensory and KC activities. The MBON signal is the selected fly's current weighted KC sum, normalized by the same reference odor response used for recruitment. Learned strengths therefore change its displayed output. Glows and traveling dots visualize those rate values; they are not measured action potentials or a spiking-neuron model. The unused aversive PPL1 pathway stays inactive.

Click a fly to inspect it, use the inset's fly selector, or choose a chef card. Drag the cloud or use arrow keys to rotate, scroll to zoom, and press R to reset. **Sniff** supplies the selected fly a 2.8-second odor cue without learning. Training also supplies a temporary cue to trained flies. With no cue, activity decays to zero. Counts show KCs with current activation above 0.08, so transitions between odors can briefly light more than the steady-state 15 cells.

**Flight circuit** view instead shows the selected fly's actual PN and KC motor features during navigation or knife carrying, mapped by neuron ID. Magnitudes are amplified 15× for visibility; ACTIVE FEATURES counts raw KC magnitudes above 0.001. The six engineered motor outputs are not biological MBONs, so the MBON/APL/PPL1 nodes and their edges stay inactive in this view. MOTOR FORCE shows the bounded force-vector magnitude actually applied to that carrier, in normalized simulation units. Autopilot and resting flies show an idle motor circuit. Returning flies keep their own features while the next crew carries the knife. Untrained carriers can have active features but zero force. Switching flight mode chooses a useful initial Brain view, and the player can select either view at any time.

## Game rules

- Free play has no deadline. Rush is 90 seconds of visible, actively simulated time; hiding the tab pauses it. Very slow rendering also slows simulation because frame catch-up is capped.
- Timing awards 60 / 100 / 150 points, plus a cut streak bonus up to 50; completing a bowl adds 200. A missed cut clears the streak.
- A rush can be restarted with the header button. Learned tastes survive round changes; page reload restores the starter crew. The best rush score and the separate flight lesson are stored locally.
- Clearing learning or restoring the starter crew also resets the current round. Every two-chef combination is supported by grip redistribution.

## Provenance and evidence

See [DATA_PROVENANCE.md](./DATA_PROVENANCE.md) for the genuine connectome extraction, licenses and selection bias. Anatomical contact counts establish the topology; synthetic smells, equation signs, activity normalization, learning rates, thresholds and game behavior are engineering choices. The full extraction includes 319 neurons and 2,117 edges; the 179 PPL1 → KC edges are retained in the immutable source but unused by this game's snack rule.

`npm test` includes the prior laboratory checks and the salad-specific suite: learning ablation/recovery, synapse selectivity, wiring sensitivity, swept 3D collision positives/negatives, 28 two-chef motor configurations, arrival gating, exact grip coupling in simulation and the scene graph, neural-activity onset/decay, all recipes, scoring and rush termination. See `evidence/motor3d-gameplay.json` and `evidence/learned-navigation-review.md` for current navigation results. `evidence/salad-results.json` and `evidence/spatial-flight-review.md` record earlier spatial-flight validation. `evidence/salad-review.md` records the earlier planar version. These are software and simulation checks, not biological validation. The old motor benchmark numbers do not describe this new preference model.

## Migrated motor evidence

The frozen 3D lesson (training seed 9317) passes 28/28 held-out settling trajectories and 14/14 stress trajectories with unseen masses and impulses. The autopilot also passes all 42. Zero-output, clamped-KC and permuted-KC controls pass none. Permuting KC features without refitting shows dependence on the learned feature mapping; it does not show that real anatomy outperforms a refitted alternative. The encoding exposes relative errors and physical scaling, and the teacher is analytically simple, so close imitation is expected.

Actual salad rollouts verify all three recipes and every two-fly crew (28/28), with genuine swept blade contacts and zero relative grip drift. Automated perfect-timing input is supplied for those rollouts. These are deterministic simulation results, not biological or human-subject evidence; arbitrary disturbances, free-flight aerodynamics, obstacles, and broader generalization are unvalidated.

Reproduce with `node scripts/motor3d-train.mjs`, `node scripts/motor3d-benchmark.mjs`, and `node scripts/motor3d-gameplay.mjs`. Frozen results are in `evidence/motor3d-benchmark.json` and `evidence/motor3d-gameplay.json`. The previous lab's 17/20 result belongs to a different planar controller and is not the score for this 3D model.
