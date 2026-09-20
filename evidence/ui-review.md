# Interface verification

The simulation source was exercised with Happy DOM 20.14.5 and the native Canvas renderer @napi-rs/canvas 1.0.9. This executes the real app event handlers and physics/neural modules, with mocked layout dimensions (900 × 520 scene). It is **not a full browser layout or accessibility audit**.

Observed checks passed:

- Autopilot balance settles at height 2.05.
- Pause freezes the displayed simulation clock; resume advances it.
- Carry mission, gust, fly removal and restoration respond.
- Loaded trained policy lifts the carry load to observed height 1.75.
- Switching to untrained uses a distinct zero-memory policy even while trained memory exists; the load falls to height 0.08.
- Reset memory removes the learned readout.
- The learned eight-second judge run reports PASS. Deterministic replay reproduces all four displayed metrics: PASS, 8.0/8.0 seconds aloft, 0.4° average absolute tilt and 0.23 mean target error.

`scene-render.png` and `carry-render.png` are renders of the real scene-drawing code using that harness. They were visually inspected. CSS has desktop and narrow layout rules; actual browser layout remains unverified because both available browser previews returned Comet's `ERR_BLOCKED_BY_CLIENT` for the loopback page. No browser security setting was changed. The local HTTP server returned successful responses.

Optional reproduction (these packages are for this extra developer check only; the app itself needs no npm install):

```powershell
npm install --no-save happy-dom@20.14.5 @napi-rs/canvas@1.0.9
# On Windows, if npm omits the native optional dependency:
npm install --no-save happy-dom@20.14.5 @napi-rs/canvas@1.0.9 @napi-rs/canvas-win32-x64-msvc@1.0.9
node tools/ui-smoke.mjs
```

The worker training implementation has a JavaScript syntax check; this harness does not create a real browser Web Worker. Headless training and serialized model loading are separately exercised by the controller tests and experiment.
