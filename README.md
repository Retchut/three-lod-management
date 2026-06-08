# Three LOD Management Example Application

The application is deployed [over here](https://three-lod-management.vercel.app).

If you're interested in running it locally or working on it, read on. Whichever the case may be, the application will be exposed at [http://localhost:5173](http://localhost:5173)

## Guides

### Asset fetching

Before developing or running the application, run the `scripts/fetchModels.sh` script first, which will fetch the referenced models in the code from a public dropbox folder, and place them in the correct location.

### Running

To run the application, either:

- run with the docker-compose config file: `docker-compose -f docker-compose.yaml up`
- build and run the provided Dockerfile: `docker build -t three-lods -f Dockerfile . && docker run -p 5173:5173 three-lods`
- install dependencies and run with your package manager of choice: (npm example) `npm install && npm run dev`

### Development

Run `scripts/setupGithooks.sh` to correctly set the current git hooks.

To run the app I recommend using the provided debug docker-compose config file: `docker-compose.debug.yaml`

---

## Assets used

"More Realistic Trees Free!" (https://skfb.ly/owLwy) by Nicholas-3D is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
LODs generated with the stock blender decimate modifier at different ratios per level.
Texture resolution was reduced by a factor of 2 in each level with imagemagick.

1. LOD 0:
   - Tree 1 - 1.0 (781716 verts, 825653 faces)
   - Tree 2 - 1.0 (514145 verts, 550533 faces)
   - Tree Trunk normal/roughness/diffuse maps - 1414x1414
   - Tree leaf opacity/normal maps - 2048x2048
1. LOD 1:
   - Tree 1 - 0.50 (552696 verts, 412826 faces)
   - Tree 2 - 0.60 (395405 verts, 330319 faces)
   - Tree Trunk normal/roughness/diffuse maps - 707x707
   - Tree leaf opacity/normal maps - 1024x1024
1. LOD 2:
   - Tree 1 - 0.25 (352863 verts, 206413 faces)
   - Tree 2 - 0.30 (237530 verts, 165159 faces)
   - Tree Trunk normal/roughness/diffuse maps - 354x354
   - Tree leaf opacity/normal maps - 512x512
1. LOD 3:
   - Tree 1 - 0.12 (246789 verts, 99078 faces)
   - Tree 2 - 0.17 (171604 verts, 93590 faces)
   - Tree Trunk normal/roughness/diffuse maps - 177x177
   - Tree leaf opacity/normal maps - 256x256

---

## TODO - Essential

### Features

- [x] basic scene utilities and application loop
- [x] basic asset management and spawning utilities
- [x] flying camera controls
- [x] debug/performance tracking utilities
  - [x] basic memory and framerate display
  - [x] visible polygon counts
  - [ ] better poly count view
- [x] ui controls
  - [x] entity spawning
    - [x] spawning entities
    - [x] selecting from loaded entities
  - [x] scene selection
  - [x] lod quality controls
- [x] lod implementation
  - [x] generate LODs (not on code)
  - [x] load lods into cache
  - [x] swap between lods based on distance
  - [x] verify histeresis
  - [ ] reduce lod distance based on device specs, on first load (need to test on at least a couple of devices first though)
  - [ ] visual blend between lod versions
  - [x] reduce lod distance based on hit to fps
  - [ ] dynamically adjust performance based on recent modifications and recent performance history
    - [ ] increase/decrease adjustment interval
    - [ ] increase/decrease adjustment values

### Optimizations

- [ ] Use InstancedMeshes when spawning objects into the scene
- [ ] Use the same material and swap out textures when transitioning between lods (this might help with blending later on as well)

### Testing

The following objectives are on hold until I manage to compose a more realistic scene that I can perform some more concrete tests on.

- [ ] test scene instances disposal, when changing scene, to check for memory leaks
- [ ] figure out why I'm unable to run in webgpu mode on my local setup
- [ ] figure out how to extract metrics in android devices (shenenigans with termux running a python script in the bg, mayhaps?)
- [ ] test + record metrics in different environments
  - [ ] main workstation (arch - firefox)
  - [ ] main workstation (arch - chromium)
  - [x] steam deck
  - [ ] raspberri pi 3b+
  - [ ] raspberri pi zero 2W
  - [ ] old android device
  - [ ] less old android device

---

## TODO - Good to have

### Features

- [x] app loading visual feedback
  - [ ] show this feedback once again when loading heavy scenes (requires heavy scenes)
- [x] handle window resizing
- [x] scene router
- [x] deploy the app somewhere (makes testing across devices easier)
- [ ] allow asynchronous loading of models in AssetManager (this is if we ever want to allow the user to load their own assets)
  - [ ] store unfulfilled promises in AssetManager's cache
  - [ ] ensure that we only check for the promise status and load models into the scene appropriately

### Optimizations

- [ ] work on more interesting/realistically useful scenes
- [ ] look into texture compression (going for KTX2 might be too optimistic though)

---
