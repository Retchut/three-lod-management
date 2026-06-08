# TODO

## Essential

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

#### Essential Optimizations

- [ ] Use InstancedMeshes when spawning objects into the scene
- [ ] Use the same material and swap out textures when transitioning between lods (this might help with blending later on as well)

### Testing:

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

## Good to have

### Features

- [ ] app loading visual feedback
- [ ] handle window resizing
- [x] scene router
- [x] deploy the app somewhere (makes testing across devices easier)
- [ ] allow asynchronous loading of models in AssetManager (this is if we ever want to allow the user to load their own assets)
  - [ ] store unfulfilled promises in AssetManager's cache
  - [ ] ensure that we only check for the promise status and load models into the scene appropriately

### Optimizations

- [ ] work on more interesting/realistically useful scenes
- [ ] look into texture compression (going for KTX2 might be too optimistic though)
