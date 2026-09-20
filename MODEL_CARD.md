# Fruit Fly Fruit Ninja — motor laboratory model card

This card describes the preserved laboratory at `lab.html`. The salad game is documented in `GAME_MODEL.md`.

A virtual, normalized-unit cooperative transport experiment. This does not control insects or hardware and does not estimate a real fly's lifting capacity.

The default interface now renders real 3D meshes using Three.js/WebGL with an orbiting camera, lighting and shadows. **The validated physical dynamics remain planar (x/y translation and rotation about z)**. Camera movement and cosmetic wing motion do not add force or a new control axis. The earlier learning results describe this unchanged planar controller, not a six-degree-of-freedom flight experiment. The original 2D view is available at `index2d.html` for browsers without WebGL.

## What is real anatomy?

The unchanged MaleCNS v1.0 extract contains 319 neuron IDs and 2,117 directed anatomical connections. The computational controller uses the 1,362 observed PN-to-KC connections between 124 projection neurons and 192 Kenyon cells. Raw contact counts are normalized for a mathematical feature transform. They are **not measured physiological weights**. Positive signs and engineered activity dynamics are model assumptions. The other supplied relations are provenance/context, not a flight circuit.

The sample is biased toward KCs strongly connected to MBON11. It is neither a full brain nor a random sample. Source annotation does not establish all input cells' sensory modalities or transmitter signs. See DATA_PROVENANCE.md and data/provenance.json.

## What is engineered?

The rigid beam, gravity, collision response, force limits, sensors, target broadcast, force readout, teaching examples, reward/success definitions and kitchen graphics are engineering choices. Eight idealized massless force actuators are rigidly attached at separate beam positions. Their forces and moment arms drive one rigid body's translation and rotation. Flies are not independently simulated aerodynamic bodies. Their wing animation is cosmetic.

The baseline is a proportional/derivative autopilot with engineered allocation across attachment points. The learned mode imitates this teacher using a readout of connectome-constrained activity. Each fly has separate runtime activity and learned readout arrays. **Only added readout parameters learn; anatomical connections do not change.** This is supervised imitation, not discovery of cooperation through biological dopamine plasticity. A target and shared beam/load information are available to all agents; it is not communication-free emergent coordination.

## How to interpret learning

Measured final result: **17/20** held-out scenarios succeeded, versus **0/20** with an untrained/reset readout. The four extrapolation stress scenarios all failed for the learned controller; the analytic teacher succeeded in all 24. Neural-clamped and post-training feature-permuted controllers succeeded in 0/24. Training fitted 386 added coefficients per agent, using 2,400 teacher samples per agent and ridge penalty 0.001, in approximately 0.91 seconds on this machine. Mean training squared error was 0.001251 on forces normalized by the per-fly cap. Training loss is not the success metric.

Untrained/readout-reset agents have no acquired policy. Training fits action targets produced by the teacher. Evaluation freezes the learned parameters. A neural-clamp or post-training scramble test asks whether the learned controller depends on its neural features; it does not establish that biological wiring is better than other feature transforms. The direct observation baseline is an important simpler alternative.

Read evidence/experiment-results.json for all measured trial results, failure cases, training settings and distributions. Numbers are computed by scripts/experiment.mjs, never painted into the animation. Success requires sustained physical proximity, low tilt and low speed; a beam visiting the goal briefly is insufficient. Interactive changes can exceed the measured evaluation distribution.

The 20 final cases use a structured condition grid with fresh deterministic gust seeds after model selection; they are not 20 independent randomly sampled experiments. The four stress cases combine masses 3–4.05, initial angles ±0.9 radians, and two disabled agents. The direct affine comparator failed all 24, but it used a different training protocol (5,000 random states, without the neural model's mixture of random states and teacher rollouts). That result cannot establish an advantage of real anatomy. The post-training scramble permutes KC feature identities without retraining; it tests readout dependence, not the benefit of the biological topology. A retrained random-wiring comparison was not performed.

The first Adam-based exploratory model failed 20/20 tuning trials. A deterministic encoder hash mixing defect was corrected and ridge fitting replaced Adam before final evaluation. The model-selection record is included in the experiment JSON. Learned and reset variants have identical physical starting conditions and disturbances; no learning occurs during evaluation.

## Signals and equations

Shared broadcasts are goal error, beam translation/rotation, total mass, enabled-agent count and the first two moments of active attachment positions. Agent-specific observations are attachment position, enabled status and its previous applied force. These are privileged engineered sensors, not inferred biological measurements.

For each agent, the 15-value observation is mapped by a deterministic, fixed random encoder to 124 signed tanh features. The 1,362 real PN→KC edges mix these features using incoming-normalized contact counts. Another tanh produces 192 signed KC features. Two independently fitted affine readouts produce horizontal and vertical force commands. Signed features are abstract variables, not neuronal firing rates. The physics module caps each applied force vector's magnitude at 8. No direct observation-to-action shortcut is added in learned mode.

The beam uses semi-implicit Euler integration at 120 steps per simulated second. Inertia is mass × length² / 12. Attachment positions rotate with the beam, so each bounded actuator creates both force and torque. Contacts use geometric penetration correction, restitution and angular damping; they are a simplified collision response, not a full contact impulse solver. Only collision constraints and initial resets directly correct positions; the target does not.

## Limits and related work

This is a small 2D control demonstration, with ideal attachment constraints and no fluid dynamics, flapping-wing aerodynamics, muscle model, insect behavior or biological learning validation. A pea on the drawn utensil is represented by the beam's total payload mass, not a separately simulated rolling body. Delivery means holding that combined load at the marked goal.

[Flybody](https://github.com/TuragaLab/flybody) offers a much richer MuJoCo fly body and artificial learned locomotion controllers; it is background inspiration, not a dependency or validation of this model. [Cooperative robotic transport research](https://www.nature.com/articles/s41467-025-61896-7) concerns engineered robots and does not show that the fruit fly connectome supplies natural utensil use.
