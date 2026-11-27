# THE LAST FIREWALL – RISE OF THE NULL KING

A lightweight Decentraland SDK7 boss-fight scene for the Game Over 2026 jam. The encounter is designed to finish in under five minutes and targets the World `rgl31.dcl.eth`.

## Gameplay

Survive the four-phase encounter:

1. **Awakening** – dodge the Null King's laser sweeps and energy blasts.
2. **Shield** – approach all three generators and press **E** when prompted to synchronize them.
3. **Reflect** – hold **F** as a core projectile reaches you to reflect it back. Three consecutive reflections unlock the hidden achievement.
4. **Execution** – approach the exposed core and press **E** or click three times to purge the Null King.

The native Decentraland avatar controls handle movement. **Space** applies a short dodge impulse. The scene tracks player health, boss health, attack collisions, phase transitions, victory, and defeat.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run build
npm run start
```

`npm run build` bundles `src/index.ts` and performs strict SDK7 type checking. `npm run start` launches the official SDK7 local preview; visual behavior still needs verification in Creator Hub or Decentraland Explorer in an environment with a runtime view.

## Project layout

- `src/index.ts` – ECS scene setup, boss phases, attacks, collision checks, physics dodge, and interaction logic.
- `src/ui.tsx` – React-ECS HUD for phase, health, timer, generators, warnings, achievement, and results.
- `design/gdd.md` – concise game design record.
- `scene.json` – SDK7 scene metadata, one-parcel layout, spawn point, and World target.
- `assets/scene/main.composite` – generated SDK7 composite metadata from the official scaffold.

The current arena is intentionally authored from low-poly SDK primitives at runtime so the playable encounter remains asset-free and lightweight. This is suitable for the current code-first prototype, but the static arena can be migrated into the composite through Creator Hub before a final art pass if editor-selectable static geometry is required.

## Performance target

The encounter uses primitive meshes, no downloaded models or textures, one parcel, a small fixed arena, and short-lived attack entities. Avoid adding high-resolution assets, unnecessary colliders, or per-frame entity creation before testing on the target 4 GB Windows laptop. Use the Explorer performance panel (`P`) during preview.

## World deployment preparation

The project is configured for `rgl31.dcl.eth`, but deployment is intentionally not performed by this repository workflow. Deployment requires the owner’s wallet signing and explicit approval:

```bash
npm run build
npx @dcl/sdk-commands deploy --target-content https://worlds-content-server.decentraland.org
```

Do not run the deploy command without confirming the wallet, World ownership, final build, and deadline. The approved deadline is **November 30, 2026 at 23:59 UTC**.

## License

Released under the MIT License. See [LICENSE](LICENSE).
