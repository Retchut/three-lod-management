# TODO

## Essential

- [x] basic scene utilities and application loop
- [x] basic asset management and spawning utilities
- [x] flying camera controls
- [ ] debug/performance tracking utilities
  - [x] basic memory and framerate display
  - [x] visible polygon counts
  - [ ] better poly count
- [ ] ui controls
  - [ ] changing between camera types
  - [x] entity spawning
    - [x] spawning entities
    - [x] selecting from loaded entities
- [ ] lod implementation
  - [x] generate LODs (not on code)
  - [x] load lods into cache
  - [x] swap between lods based on distance
  - [ ] verify histeresis
  - [ ] better blend between distances
  - [ ] reduce lod distance based on device specs
  - [ ] reduce lod distance based on hit to fps

### Testing:

- [ ] figure out why I'm unable to run in webgpu mode on my local setup
- [ ] figure out how to extract metrics in android devices (shenenigans with termux running a python script in the bg, mayhaps?)
- [ ] test + record metrics in different environments
  - [ ] main workstation (arch - firefox)
  - [ ] main workstation (arch - chromium)
  - [ ] raspberri pi 3b+
  - [ ] raspberri pi zero 2W
  - [ ] old android device
  - [ ] less old android device

### Good to have

- [ ] implement scene instances disposal, when changing scene (might not be an issue if we don't change the scenes, I need to test that still)
- [ ] scene router
- [ ] deploy the app somewhere (makes testing easier)
- [ ] handle window resizing
- [ ] work on slightly more interesting scenes
- [ ] look into texture compression (going for KTX2 might be too optimistic though)
- [ ] allow asynchronous loading of models in AssetManager (this is if we ever want to allow the user to load their own assets)
  - [ ] store unfulfilled promises in AssetManager's cache
  - [ ] ensure that we only check for the promise status and load models into the scene appropriately
