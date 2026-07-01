# Three LOD Management Example Application

The application is deployed [over here](https://three-LOD-management.vercel.app).

If you're interested in running it locally or working on it, read on. Whichever the case may be, the application will be exposed at [http://localhost:5173](http://localhost:5173)

## Guides

### Asset fetching

Before developing or running the application, run the `scripts/fetchModels.sh` script first, which will fetch the referenced models in the code from a public dropbox folder, and place them in the correct location.

### Running

To run the application, either:

- run with the docker-compose config file: `docker-compose -f docker-compose.yaml up`
- build and run the provided Dockerfile: `docker build -t three-LODs -f Dockerfile . && docker run -p 5173:5173 three-LODs`
- install dependencies and run with your package manager of choice: (npm example) `npm install && npm run dev`

### Development

Run `scripts/setupGithooks.sh` to correctly set the current git hooks.

To run the app I recommend using the provided debug docker-compose config file: `docker-compose.debug.yaml`

---

## Assets used

LODs were _mostly_ generated with the stock blender decimate modifier at different ratios per level. Exceptions are highlighted in their respective sections.
Texture resolution was reduced by a factor of 2 in each level with imagemagick.

### "More Realistic Trees Free!"

"More Realistic Trees Free!" (https://skfb.ly/owLwy) by Nicholas-3D is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

| Variant | LOD | Ratio | Vertices | Faces  |
| ------- | --- | ----- | -------- | ------ |
| 0       | 0   | 1.0   | 781716   | 825653 |
| 0       | 1   | 0.5   | 552696   | 412826 |
| 0       | 2   | 0.25  | 352863   | 206413 |
| 0       | 3   | 0.12  | 246789   | 99078  |
| 1       | 0   | 1.0   | 514145   | 550533 |
| 1       | 1   | 0.6   | 395405   | 330319 |
| 1       | 2   | 0.3   | 237530   | 165159 |
| 1       | 3   | 0.17  | 171604   | 93590  |

| Texture | LOD 0     | LOD 1     | LOD 2   | LOD 3   |
| ------- | --------- | --------- | ------- | ------- |
| Bark    | 1414x1414 | 707x707   | 354x354 | 177x177 |
| Leaf    | 2048x2048 | 1024x1024 | 512x512 | 256x256 |

### "Realistic Building"

"Realistic Building" (https://skfb.ly/pERBE) by abhayexe is licensed with sketchfab's Free Standard License.

| Variant | LOD | Ratio | Vertices | Faces |
| ------- | --- | ----- | -------- | ----- |
| ---     | 0   | 1.0   | 18977    | 13976 |
| ---     | 1   | 0.5   | 12792    | 6988  |
| ---     | 2   | 0.25  | 9939     | 3494  |
| ---     | 3   | 0.10  | 8367     | 1397  |

| Texture  | LOD 0     | LOD 1     | LOD 2   | LOD 3   |
| -------- | --------- | --------- | ------- | ------- |
| Windows  | 512x512   | 256x256   | 128x128 | 64x64   |
| Building | 2048x2048 | 1024x1024 | 512x512 | 256x256 |

### "Realistic Building PBR"

"Realistic Building PBR" (https://skfb.ly/pEJJX) by abhayexe is licensed with sketchfab's Free Standard License.

| Variant | LOD | Ratio | Vertices | Faces |
| ------- | --- | ----- | -------- | ----- |
| ---     | 0   | 1.0   | 14744    | 10720 |
| ---     | 1   | 0.89  | 13680    | 9540  |
| ---     | 2   | 0.40  | 9033     | 4288  |
| ---     | 3   | 0.15  | 6879     | 1607  |

| Texture  | LOD 0     | LOD 1     | LOD 2   | LOD 3   |
| -------- | --------- | --------- | ------- | ------- |
| Building | 2048x2048 | 1024x1024 | 512x512 | 256x256 |

### "Moscow Lamp Post"

"Moscow Lamp Post" (https://skfb.ly/oO7sB) by CrazyPolski is licensed with sketchfab's Free Standard License.

| Variant | LOD | Ratio | Vertices | Faces |
| ------- | --- | ----- | -------- | ----- |
| ---     | 0   | 1.0   | 543      | 543   |
| ---     | 1   | 0.5   | 283      | 308   |
| ---     | 2   | 0.25  | 148      | 193   |
| ---     | 3   | 0.10  | 67       | 97    |

| Texture | LOD 0   | LOD 1       | LOD 2  | LOD 3  |
| ------- | ------- | ----------- | ------ | ------ |
| Lamp    | 143x623 | (unchanged) | 71x309 | 35x152 |

### "Strange building with graffity "Eteki""

"Strange building with graffity "Eteki"" (https://skfb.ly/o9oBW) by randombug is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

| Variant | LOD | Ratio | Vertices | Faces |
| ------- | --- | ----- | -------- | ----- |
| ---     | 0   | 1.0   | 262      | 405   |
| ---     | 1   | 0.5   | 141      | 202   |
| ---     | 2   | 0.25  | 86       | 101   |
| ---     | 3   | 0.125 | 59       | 49    |

| Texture  | LOD 0     | LOD 1     | LOD 2   | LOD 3   |
| -------- | --------- | --------- | ------- | ------- |
| Building | 2048x2048 | 1024x1024 | 512x512 | 256x256 |

### "Rocks Variants"

"Rocks Variants" (https://skfb.ly/6ZUNX) by RBG_illustrations is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

| Variant | LOD | Ratio | Vertices | Faces |
| ------- | --- | ----- | -------- | ----- |
| 0       | 0   | 1.0   | 610      | 611   |
| 0       | 1   | 0.2   | 123      | 212   |
| 0       | 2   | 0.005 | 5        | 6     |
| 1       | 0   | 1.0   | 726      | 724   |
| 1       | 1   | 0.2   | 146      | 232   |
| 1       | 2   | 0.005 | 5        | 6     |
| 2       | 0   | 1.0   | 1066     | 1064  |
| 2       | 1   | 0.2   | 214      | 362   |
| 2       | 2   | 0.005 | 7        | 10    |

### "Slate Stepping Stones"

"Slate Stepping Stones" (https://skfb.ly/pqD8L) by Oyugi Mark is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

| Variant | LOD | Ratio | Vertices | Faces |
| ------- | --- | ----- | -------- | ----- |
| ---     | 0   | 1.0   | 1050     | 521   |
| ---     | 1   | 0.25  | 272      | 180   |
| ---     | 2   | 0.05  | 64       | 34    |

| Texture | LOD 0   | LOD 1   | LOD 2 |
| ------- | ------- | ------- | ----- |
| Slate   | 400x350 | 200x175 | 99x87 |

### "grass"

"grass" (https://skfb.ly/pITvY) by lev26 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

LOD 1 was generated using Blender's "Merge by Distance" Clean-Up Tool.
LOD 2 is an impostor made by hand.

| Variant | LOD | Distance | Vertices | Faces |
| ------- | --- | -------- | -------- | ----- |
| ---     | 0   | ---      | 320      | 160   |
| ---     | 1   | 0.19     | 50       | 96    |
| ---     | 2   | ---      | 8        | 2     |

| Texture | LOD 0   | LOD 1   | LOD 2   |
| ------- | ------- | ------- | ------- |
| Grass   | 920x800 | 460x400 | 230x200 |

---

## TODO - Essential

### Features

- [x] basic scene utilities and application loop
- [x] basic asset management and spawning utilities
- [x] flying camera controls
  - [ ] improve camera controls
- [x] debug/performance tracking utilities
  - [x] basic memory and framerate display
  - [x] visible polygon counts
  - [ ] better poly count view
- [x] ui controls
  - [x] entity spawning
    - [x] spawning entities
    - [x] selecting from loaded entities
  - [x] scene selection
  - [x] LOD quality controls
    - [x] allow disabling PerformanceManager adjustments, for testing
    - [x] select LOD transitioning method
- [x] LOD implementation
  - [x] generate LODs (not on code)
  - [x] load LODs into cache
  - [x] swap between LODs based on distance
  - [x] verify histeresis
  - [ ] reduce LOD distance based on device specs, on first load (need to test on at least a couple of devices first though)
  - [x] visual blend between LOD versions
    - [ ] tweak blend algorithm to use an easing function for assigning the opacity to the fading in and out level
    - [ ] decouple blending from the distance to the object, in order to avoid popping in circumstances where the distance to the object changes suddenly or new LODs become available (after assets finish loading or when the global performance changes suddenly)
  - [x] reduce LOD distance based on hit to fps
  - [ ] dynamically adjust performance based on recent modifications and recent performance history
    - [ ] increase/decrease adjustment interval
    - [ ] increase/decrease adjustment values

### Optimizations

- [ ] Use InstancedMeshes when spawning objects into the scene

~~- [ ] Use the same material and swap out textures when transitioning between LODs (this might help with blending later on as well)~~

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
- [x] allow asynchronous loading of models in AssetManager (this is if we ever want to allow the user to load their own assets)
  - [x] store unfulfilled promises in AssetManager's cache
  - [x] ensure that we only check for the promise status and load models into the scene appropriately

### Optimizations

- [ ] work on more interesting/realistically useful scenes
- [ ] look into texture compression (going for KTX2 might be too optimistic though)

---
