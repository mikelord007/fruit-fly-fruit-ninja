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

The recipe selects an ingredient; its learned response selects volunteers. At least two are required. An engineered coordinator distributes them across the grip. The existing planar rigid-body simulator runs at 120 Hz with mass 0.55, gravity, torque, damping, contact constraints and a force cap of 8 per fly. A conventional PD controller generates the forces. This motor controller does not learn in the salad game. The original learned-motor experiments remain separately available in the physics lab.

The knife has a rendered blade and matching collision edge from local x = −0.75 to 1.4, y = −0.16. A cut requires downward speed greater than 0.25 and swept edge contact with the spherical fruit proxy. Motion is subdivided at no more than 0.025 units of estimated edge travel. The timing meter determines a score bonus, never whether geometry is hit. A miss causes another lift. One contact awards one cut per ingredient.

The knife is integrated during lifting, waiting for the chop, cutting, plating and return. At rest/recruitment the simulation parks it near the board while the visual flies change crews; attachment and handoff are idealized. Fly bodies visually interpolate to actuator positions. This is a stylized 3D presentation of planar physical dynamics, not full free-flight aerodynamics or six-degree-of-freedom insect locomotion.

Fruit halves, juice particles and their flight into the bowl are authored animations triggered by contact. They are not fracture mechanics or independently simulated food transport. Ingredients appear on the board between stages. Knife collision and motor dynamics determine the cut; decorative animation does not.

## Game rules

- Free play has no deadline. Rush is 90 seconds of visible, actively simulated time; hiding the tab pauses it. Very slow rendering also slows simulation because frame catch-up is capped.
- Timing awards 60 / 100 / 150 points, plus a cut streak bonus up to 50; completing a bowl adds 200. A missed cut clears the streak.
- A rush can be restarted with the header button. Learned tastes survive round changes; page reload restores the starter crew. Only the best rush score is stored locally.
- Clearing learning or restoring the starter crew also resets the current round. Every two-chef combination is supported by grip redistribution.

## Provenance and evidence

See [DATA_PROVENANCE.md](./DATA_PROVENANCE.md) for the genuine connectome extraction, licenses and selection bias. Anatomical contact counts establish the topology; synthetic smells, equation signs, activity normalization, learning rates, thresholds and game behavior are engineering choices. The full extraction includes 319 neurons and 2,117 edges; the 179 PPL1 → KC edges are retained in the immutable source but unused by this game's snack rule.

`npm test` includes the prior laboratory checks and the salad-specific suite: learning ablation/recovery, synapse selectivity, wiring sensitivity, swept collision positives/negatives, 28 two-chef motor configurations, all recipes, scoring and rush termination. See `evidence/salad-results.json` and `evidence/salad-review.md` for measured results. These are software and simulation checks, not biological validation. The old motor benchmark numbers do not describe this new preference model.
