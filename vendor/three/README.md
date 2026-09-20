# Vendored Three.js

Three.js **0.186.0**, downloaded from the public npm `three` package. MIT license, copyright Three.js Authors; see LICENSE in this folder.

Included: `build/three.module.js`, `build/three.core.js`, and `examples/jsm/controls/OrbitControls.js`. The only change to OrbitControls is replacing its bare `three` import with `./three.module.js` for offline native-module loading. No CDN or build step is needed to run the app.

Official documentation: https://threejs.org/docs/ and https://threejs.org/manual/pages/installation.html
