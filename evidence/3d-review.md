# Three.js upgrade verification

The main interface uses locally bundled Three.js 0.186.0 and OrbitControls. It builds real mesh geometry, perspective projection, lights, shadows, ray picking and a movable camera. It reads the existing planar physical state; it does not write the beam's desired pose or add untested 3D forces.

## Automated checks

`npm test` passes **20/20** tests. Four new scene tests verify the 3D beam/eight-fly structure, exact pose/attachment synchronization without mutating the world, complete payload visibility, and ray selection through actual Three.js geometry. The existing physics, anatomy, training and numerical tests remain passing. App, fallback app and scene modules pass JavaScript syntax checks.

## Actual WebGL browser checks

Unlike the earlier 2D review, the available in-app browser successfully opened loopback and rendered the real GPU scene. Desktop (1440 × 1000) and narrow (390 × 844) layouts were inspected. The narrow page had no horizontal overflow. Camera projection adapts to portrait aspect ratios so the crew is not clipped by the default field of view.

Verified in the live interface:

- Autopilot lift, 3D geometry, animated wings, tethers, force arrows and shadows.
- Front and crew camera presets; orbit dragging leaves the physical goal unchanged.
- Double-click ray placement moves the target on the x/y simulation plane and synchronizes coordinate controls.
- Click selection identifies an individual 3D fly (Fly 8 selected in the browser). An initial bug where decorative leg lines swallowed hits was fixed and regression-tested.
- Browser worker training completed with 2,400 samples per fly and updated learned readouts.
- The learned Carry a Pea judge run returned PASS, 8.0/8.0 seconds aloft, 0.4° mean tilt and 0.23 mean target error. Replay returned the same outcome and metrics.
- Pause freezes simulation time while camera inspection remains available.

A Three.js shadow-map deprecation warning found during review was corrected by using the supported PCFShadowMap constant. Startup/context-loss messaging and an explicit 2D fallback are implemented; GPU context loss was not deliberately injected.

## Scope

This is a 3D visualization of the validated 2D experiment, not a six-degree-of-freedom flight controller. Existing 17/20 held-out and 0/4 extrapolation results remain the same planar benchmark. `index2d.html` and `src/app2d.js` preserve the original view. `tools/ui-smoke.mjs` now targets that 2D fallback; its Canvas output files are historical 2D renders, not screenshots of the WebGL scene.
