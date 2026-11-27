# The Last Firewall – Rise of the Null King

## Owner brief

A lightweight Decentraland SDK7 final-boss experience for the Game Over 2026 jam. The player must defeat THE NULL KING before the five-minute countdown expires through four readable phases: survive the awakening, disable three generators, reflect projectiles, then land three reactor hits. Losing all player health or reaching zero time produces a defeat state.

## Core loop

- Move with native Decentraland avatar locomotion. Space dodges in the recent horizontal movement direction, or away from the boss when standing still.
- Read red telegraphs, leave the danger area, and preserve health.
- Walk close to each generator and press E once to synchronize it while the boss continues attacking.
- In the reflection phase, hold F as a projectile reaches the player to send it back.
- In the execution phase, approach the exposed reactor and press E or click three times.

## Agent-decided implementation choices

- [agent-decided] Use the official TypeScript SDK7 scene template and `@dcl/sdk-commands`.
- [agent-decided] Keep the first playable build one parcel, primitive-based, and asset-free to minimize download size and memory use on a Windows 10 / 4 GB RAM laptop.
- [agent-decided] Use a small runtime attack pool and scripted distance checks instead of heavy physics.
- [agent-decided] Use React-ECS HUD for phase, health, generator progress, timer, warnings, victory, defeat, and the hidden triple-reflection achievement.
- [agent-decided] Use native avatar movement and SDK7 Physics impulse for dodge feedback; the scene never writes the player Transform.
