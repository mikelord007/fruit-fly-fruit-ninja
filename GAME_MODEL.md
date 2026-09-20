# Fruit Fly Fruit Ninja: game model

Fruit Fly Fruit Ninja is a 3D salad game about learned preferences. It is not a claim that real flies cooperate with knives or that playing improves human neuroplasticity.

## What the player changes

Eight chefs have independent simulated KC → MBON strengths. Synthetic apple, orange, strawberry and kiwi smells activate 124 projection-neuron inputs. Their activity travels through 1,362 anatomical PN → KC contacts to 192 Kenyon cells, with a simplified APL inhibitory loop and a top-15 sparsity rule. A fixed smell produces the same activity pattern in every chef; different training histories produce different preferences.

Every smell + snack pairing changes active KC → MBON strengths:

`new = old + 0.28 × KC activity × (1.5 × anatomical count − old)`

Initial strength is `0.2 × anatomical count`. The response is the weighted KC sum divided by the corresponding sum using anatomical counts. Chefs volunteer at response ≥ 0.72. A training click applies six pairings; changes persist for the current page session. Weights remain bounded. Inactive edges and unselected chefs do not change. The raw anatomical JSON is never modified.

This is an **engineered appetitive game rule**, not a validated physiological learning law. The extracted PPL101 → KC / KC → MBON11 compartment is associated with the original aversive model. The snack rule deliberately does **not** use its PPL1 pathway or relabel that aversive teaching signal as reward. Bidirectional learning, extinction, spiking dynamics, receptor identities and physiological units are not modeled.

The starter crew receives six recorded training pairings each: Pip/Basil/Fig learn apple; Zest/Miso/Boba learn orange; Dot/Bean learn strawberry. These are initialization histories, not immutable fruit assignments. Clearing learning removes all volunteers. Teaching new smells can produce multiple preferences and generalization because odors share active neurons. Kiwi begins untrained to make the causal effect visible during a short demo.

## What moves the knife

The recipe selects an ingredient; its learned response selects volunteers. At least two are required. An engineered coordinator distributes them across the grip. The salad game's rigid body now translates in X/Y/Z and rotates with a quaternion at 120 Hz. It uses mass 0.55, gravity, linear damping, worktop/boundary contacts and a force cap of 8 per fly. Engineered grip motors supply a bounded torque of 0.9 per fly. A conventional PD controller generates these forces and torques, with an isotropic inertia approximation of `mass × 2.8² / 12`. These are simplified motor actuators, not fly aerodynamics. The original planar learned-motor experiments remain separately available in the physics lab.

The knife has a rendered blade and matching collision edge from local x = −0.75 to 1.4, y = −0.16, z = 0. A cut requires downward speed greater than 0.25 and swept 3D edge contact with the spherical fruit proxy. The sweep interpolates XYZ position and quaternion orientation and subdivides at no more than 0.025 units of estimated edge travel. A blade passing behind the fruit cannot cut it. The timing meter determines a score bonus, never whether geometry is hit. A miss causes another lift. One contact awards one cut per ingredient.

The knife is integrated during lifting, waiting for the chop, cutting, plating and return. It parks on a rear knife rest while crews change. Flies begin on eight distinct perches: window sill, jar, mug, shelves and countertop edges at different depths. They follow deterministic cubic 3D flight paths to their assigned grips and return to their perches after release. These approach paths are authored spatial paths, not aerodynamic simulation or obstacle planning. Recruitment cannot move the knife until every required carrier has arrived.

Attached flies use the knife's exact pose plus a fixed local grip offset. Their meshes become children of the knife rig; there is no separate carrier interpolation. Both simulation state and rendering are tested for zero relative attachment drift during movement and rotation. Grip constraints and the parked knife rest are idealized; free insect flight is not physically modeled.

Fruit halves, juice particles and their flight into the bowl are authored animations triggered by contact. They are not fracture mechanics or independently simulated food transport. Ingredients appear on the board between stages. Knife collision and motor dynamics determine the cut; decorative animation does not.

## Live Brain panel

The inset contains all 319 circuit neuron identities and displays a subset of the actual connections. Its rotatable 3D layout is **schematic**, not measured soma coordinates or a whole-brain reconstruction. The visual direction was inspired by [Aimbug's Brain panel](https://aimbug.domi.zip/); no code, neuron positions, or artwork was copied.

Each fly has independent live PN/KC/APL/MBON rate state. The current ingredient broadcasts its synthetic odor cue; first-order filters approach the circuit's computed sensory and KC activities. The MBON signal is the selected fly's current weighted KC sum, normalized by the same reference odor response used for recruitment. Learned strengths therefore change its displayed output. Glows and traveling dots visualize those rate values; they are not measured action potentials or a spiking-neuron model. The unused aversive PPL1 pathway stays inactive.

Click a fly to inspect it, use the inset's fly selector, or choose a chef card. Drag the cloud or use arrow keys to rotate, scroll to zoom, and press R to reset. **Sniff** supplies the selected fly a 2.8-second odor cue without learning. Training also supplies a temporary cue to trained flies. With no cue, activity decays to zero. Counts show KCs with current activation above 0.08, so transitions between odors can briefly light more than the steady-state 15 cells.

## Game rules

- Free play has no deadline. Rush is 90 seconds of visible, actively simulated time; hiding the tab pauses it. Very slow rendering also slows simulation because frame catch-up is capped.
- Timing awards 60 / 100 / 150 points, plus a cut streak bonus up to 50; completing a bowl adds 200. A missed cut clears the streak.
- A rush can be restarted with the header button. Learned tastes survive round changes; page reload restores the starter crew. Only the best rush score is stored locally.
- Clearing learning or restoring the starter crew also resets the current round. Every two-chef combination is supported by grip redistribution.

## Provenance and evidence

See [DATA_PROVENANCE.md](./DATA_PROVENANCE.md) for the genuine connectome extraction, licenses and selection bias. Anatomical contact counts establish the topology; synthetic smells, equation signs, activity normalization, learning rates, thresholds and game behavior are engineering choices. The full extraction includes 319 neurons and 2,117 edges; the 179 PPL1 → KC edges are retained in the immutable source but unused by this game's snack rule.

`npm test` includes the prior laboratory checks and the salad-specific suite: learning ablation/recovery, synapse selectivity, wiring sensitivity, swept 3D collision positives/negatives, 28 two-chef motor configurations, arrival gating, exact grip coupling in simulation and the scene graph, neural-activity onset/decay, all recipes, scoring and rush termination. See `evidence/salad-results.json` and `evidence/spatial-flight-review.md` for current results. `evidence/salad-review.md` records the earlier planar version. These are software and simulation checks, not biological validation. The old motor benchmark numbers do not describe this new preference model.
