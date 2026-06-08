# Three LOD Management Example Application

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
