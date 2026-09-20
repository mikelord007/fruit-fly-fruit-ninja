# Fruit Fly Fruit Ninja: verification

Verified on 2026-09-20 in Node.js and the Codex in-app WebGL browser.

## Automated results

- `npm test`: 32 tests passed, zero failures. Includes the preserved lab tests and 12 salad tests.
- `npm run salad:benchmark`: 3/3 recipes completed; 28/28 two-chef combinations lifted, contacted fruit, returned the knife and served. Each three-fruit recipe took 26.39 simulated seconds with supplied perfect-timing input and scored 680.
- Resetting simulated synapses prevented recruitment and cutting; retraining recovered volunteering and completion.
- Stationary, upward, horizontally displaced and overhead blade paths did not cut. A fast downward swept intersection did.
- Anatomical data SHA-256 remained `e00582e5d828d727f89325ff9e662176179ef2268460dbbfedb1a1cfc7d0b9d1`.

## Browser checks

- Real Three.js/WebGL kitchen rendered with moving wings, waiting flies, knife pickup/carry, fruit, bowl and shadows.
- A green recipe waited with zero kiwi volunteers. Training the default Pip/Miso pair changed 30 synapses and recruited exactly those two chefs. The pending order resumed.
- A complete Sunshine bowl was played through the browser with keyboard Space and the Chop button. Apple, orange and strawberry recruited distinct crews; score increased on contact; completion showed one served bowl, 590 points and the +200 bowl message. The knife returned to the counter between crews.
- Rush mode started and its visible timer decreased. Expiration and score freezing are covered by the headless test.
- Responsive layouts visually checked at desktop width, 390 pixels and 320 pixels. The final phone scoreboard occupies a separate equal-column row; POINTS, BOWLS and SECONDS LEFT fit without crowding the heading. The renamed header also fits alongside the wrapped Restart rush button.
- No warning or error entries in the browser log during the checked game flow.

## Limits

The software tests do not validate biological appetitive learning. The game's snack rule is an engineered extension; PPL1 is not used as reward. Blade control is engineered planar physics; fruit fracture and plating are contact-triggered visual effects. Brain preferences last for the page session. The 90-second clock measures actively simulated time, pauses in a hidden tab and can slow under low frame rates.
