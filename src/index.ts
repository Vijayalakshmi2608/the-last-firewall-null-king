import {
  ColliderLayer,
  Entity,
  engine,
  InputAction,
  inputSystem,
  Material,
  MeshCollider,
  MeshRenderer,
  Physics,
  PointerEventType,
  pointerEventsSystem,
  Transform,
} from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { setupUi, hud } from './ui'

console.log('[NULL-KING][BOOT] module evaluated')

const ARENA_CENTER = Vector3.create(8, 0, 8)
const BOSS_HITBOX_CENTER = Vector3.create(8, 2.5, 8)
const PLAYER_PROJECTILE_HIT_RADIUS = 1.1
const BOSS_PROJECTILE_HIT_RADIUS = 0.95
const ENCOUNTER_DURATION_SECONDS = 5 * 60
const PLAYER_MAX_HEALTH = 100
const BOSS_MAX_HEALTH = 100
const GENERATOR_POSITIONS = [
  Vector3.create(3, 0.7, 8),
  Vector3.create(13, 0.7, 8),
  Vector3.create(8, 0.7, 13),
]

type Phase = 'AWAKENING' | 'SHIELD' | 'REFLECT' | 'EXECUTION' | 'VICTORY' | 'DEFEAT'
type AttackKind = 'laser' | 'blast' | 'projectile'

type Attack = {
  entity: Entity
  kind: AttackKind
  age: number
  life: number
  position: Vector3
  velocity: Vector3
  state: 'HOSTILE' | 'REFLECTED' | 'SPENT'
}

const game = {
  phase: 'AWAKENING' as Phase,
  phaseTime: 0,
  elapsed: 0,
  remainingTime: ENCOUNTER_DURATION_SECONDS,
  playerHealth: PLAYER_MAX_HEALTH,
  bossHealth: BOSS_MAX_HEALTH,
  shield: 100,
  generators: [0, 0, 0],
  reactorHits: 0,
  attacks: [] as Attack[],
  attackCooldown: 2.5,
  warning: 'THE NULL KING AWAKENS',
  warningTime: 3,
  lastDamageTime: -10,
  consecutiveReflections: 0,
  achievement: false,
  ended: false,
}

let bossCore = 0 as Entity
let bossEye = 0 as Entity
let shieldRing = 0 as Entity
const bossOrbiters: Entity[] = []
const generatorEntities: Entity[] = []
const generatorLights: Entity[] = []
const bossParts: Entity[] = []

function color(hex: string) {
  return Color4.fromHexString(hex)
}

function box(position: Vector3, scale: Vector3, hex: string, collider = false) {
  const entity = engine.addEntity()
  Transform.create(entity, { position, scale })
  MeshRenderer.setBox(entity)
  if (collider) MeshCollider.setBox(entity, ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER)
  Material.setPbrMaterial(entity, { albedoColor: color(hex) })
  return entity
}

function sphere(position: Vector3, scale: Vector3, hex: string) {
  const entity = engine.addEntity()
  Transform.create(entity, { position, scale })
  MeshRenderer.setSphere(entity)
  Material.setPbrMaterial(entity, { albedoColor: color(hex) })
  return entity
}

function buildArena() {
  // One-parcel, low-poly arena. Runtime entities are intentionally few and reusable.
  box(Vector3.create(8, -0.15, 8), Vector3.create(15, 0.3, 15), '#10162aff', true)
  box(Vector3.create(8, 0.15, 0.5), Vector3.create(15, 0.3, 0.3), '#263b62ff')
  box(Vector3.create(8, 0.15, 15.5), Vector3.create(15, 0.3, 0.3), '#263b62ff')
  box(Vector3.create(0.5, 0.15, 8), Vector3.create(0.3, 0.3, 15), '#263b62ff')
  box(Vector3.create(15.5, 0.15, 8), Vector3.create(0.3, 0.3, 15), '#263b62ff')

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8
    const x = 8 + Math.cos(angle) * 5.3
    const z = 8 + Math.sin(angle) * 5.3
    box(Vector3.create(x, 0.08, z), Vector3.create(0.18, 0.05, 1.2), i % 2 ? '#183b5cff' : '#246c85ff')
  }

  bossCore = sphere(Vector3.create(8, 2.5, 8), Vector3.create(1.3, 1.3, 1.3), '#ff334dff')
  bossEye = box(Vector3.create(8, 3.6, 7.0), Vector3.create(2.4, 0.35, 0.18), '#7df9ffff')
  shieldRing = sphere(Vector3.create(8, 2.5, 8), Vector3.create(3.2, 3.2, 3.2), '#182a4d66')
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI * 2 * i) / 4
    bossOrbiters.push(
      sphere(
        Vector3.create(8 + Math.cos(angle) * 2.15, 2.5, 8 + Math.sin(angle) * 2.15),
        Vector3.create(0.28, 0.28, 0.28),
        i % 2 === 0 ? '#ffcf5aff' : '#7df9ffff'
      )
    )
  }
  bossParts.push(bossCore, bossEye, shieldRing)
  box(Vector3.create(8, 1.3, 8), Vector3.create(3.6, 0.45, 1.2), '#1a233dff')
  box(Vector3.create(8, 3.8, 8), Vector3.create(3.6, 0.45, 1.2), '#1a233dff')
  box(Vector3.create(6.3, 2.5, 8), Vector3.create(0.45, 2.6, 1.0), '#1a233dff')
  box(Vector3.create(9.7, 2.5, 8), Vector3.create(0.45, 2.6, 1.0), '#1a233dff')

  GENERATOR_POSITIONS.forEach((position, index) => {
    const base = box(position, Vector3.create(1.2, 1.4, 1.2), '#17284aff', true)
    const light = sphere(Vector3.create(position.x, position.y + 0.9, position.z), Vector3.create(0.45, 0.45, 0.45), '#27e6ffff')
    generatorEntities.push(base)
    generatorLights.push(light)
    pointerEventsSystem.onProximityDown(
      {
        entity: base,
        opts: {
          button: InputAction.IA_PRIMARY,
          maxDistance: 3,
          hoverText: 'Activate generator',
          showFeedback: true,
          showHighlight: true,
        },
      },
      () => activateGenerator(index)
    )
  })
}

function activateGenerator(index: number) {
  if (game.phase !== 'SHIELD' || game.generators[index] >= 100) return
  // One clear interaction per generator keeps the encounter readable for first-time players.
  game.generators[index] = 100
  game.warning = `GENERATOR ${index + 1} SYNCHRONIZED`
  game.warningTime = 1.2
  const light = generatorLights[index]
  Material.setPbrMaterial(light, { albedoColor: color(game.generators[index] >= 100 ? '#7dff9aff' : '#ffcf5aff') })
  if (game.generators.every((value) => value >= 100)) {
    game.shield = 0
    game.phase = 'REFLECT'
    game.phaseTime = 0
    game.attackCooldown = 1.8
    game.warning = 'SHIELD BREACHED - REFLECT THE CORE BOLTS'
    game.warningTime = 3
    Material.setPbrMaterial(shieldRing, { albedoColor: color('#16203422') })
  }
}

function distance(a: Vector3, b: Vector3) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function direction(from: Vector3, to: Vector3) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
  return Vector3.create(dx / length, dy / length, dz / length)
}

function playerPosition() {
  return Transform.get(engine.PlayerEntity).position
}

function warn(text: string, seconds = 1.5) {
  game.warning = text
  game.warningTime = seconds
}

function damagePlayer(amount: number) {
  if (game.ended || game.elapsed - game.lastDamageTime < 0.45) return
  game.playerHealth = Math.max(0, game.playerHealth - amount)
  game.lastDamageTime = game.elapsed
  game.consecutiveReflections = 0
  Physics.applyKnockbackToPlayer(ARENA_CENTER, 1.2, 4, 1)
  warn(`IMPACT -${amount} HP`, 0.7)
  if (game.playerHealth <= 0) {
    game.phase = 'DEFEAT'
    game.ended = true
    warn('FIREWALL COLLAPSED', 99)
  }
}

function spawnAttack(kind: AttackKind) {
  const player = playerPosition()
  const start = Vector3.create(8, kind === 'laser' ? 0.25 : 2.4, 8)
  const velocity = direction(start, player)
  const entity = sphere(start, Vector3.create(kind === 'laser' ? 7 : 0.28, kind === 'laser' ? 0.06 : 0.28, kind === 'laser' ? 0.12 : 0.28), kind === 'laser' ? '#ff4b67ff' : '#ff9e3dff')
  game.attacks.push({
    entity,
    kind,
    age: 0,
    life: kind === 'laser' ? 0.8 : kind === 'projectile' ? 8 : 5,
    position: start,
    velocity: Vector3.create(velocity.x * (kind === 'laser' ? 0 : 4), velocity.y * 4, velocity.z * 4),
    state: 'HOSTILE',
  })
}

function updateAttacks(dt: number) {
  const player = playerPosition()
  for (let i = game.attacks.length - 1; i >= 0; i--) {
    const attack = game.attacks[i]
    attack.age += dt
    if (attack.kind === 'laser') {
      const t = attack.age / attack.life
      const angle = t * Math.PI * 2
      attack.position = Vector3.create(8, 0.25, 8)
      const laserTransform = Transform.getMutable(attack.entity)
      laserTransform.position = attack.position
      laserTransform.rotation = Quaternion.fromEulerDegrees(0, (angle * 180) / Math.PI, 0)

      const dx = player.x - 8
      const dz = player.z - 8
      const alongBeam = dx * Math.cos(angle) - dz * Math.sin(angle)
      const acrossBeam = dx * Math.sin(angle) + dz * Math.cos(angle)
      if (
        Math.abs(alongBeam) <= 3.5 &&
        Math.abs(acrossBeam) <= 0.65 &&
        Math.abs(player.y - attack.position.y) <= 1.2
      ) {
        damagePlayer(12)
      }
    } else {
      attack.position = Vector3.create(
        attack.position.x + attack.velocity.x * dt,
        attack.position.y + attack.velocity.y * dt,
        attack.position.z + attack.velocity.z * dt
      )
      Transform.getMutable(attack.entity).position = attack.position
      if (attack.state === 'HOSTILE' && distance(player, attack.position) < PLAYER_PROJECTILE_HIT_RADIUS) {
        const reflecting = game.phase === 'REFLECT' && inputSystem.isPressed(InputAction.IA_SECONDARY)
        if (reflecting) {
          attack.state = 'REFLECTED'
          attack.velocity = Vector3.create(-attack.velocity.x, -attack.velocity.y, -attack.velocity.z)
          warn('PROJECTILE REFLECTED - RETURNING TO CORE', 0.65)
        } else {
          attack.state = 'SPENT'
          damagePlayer(15)
          attack.age = attack.life
        }
      }

      // Reflected shots can only hurt the boss, and each shot is spent on its first hit.
      if (
        attack.state === 'REFLECTED' &&
        game.phase === 'REFLECT' &&
        distance(attack.position, BOSS_HITBOX_CENTER) <= BOSS_PROJECTILE_HIT_RADIUS
      ) {
        attack.state = 'SPENT'
        attack.age = attack.life
        game.bossHealth = Math.max(0, game.bossHealth - 8)
        game.consecutiveReflections += 1
        warn('REFLECTED HIT CONFIRMED', 0.8)
        if (game.consecutiveReflections >= 3) game.achievement = true
      }
    }
    if (attack.age >= attack.life || attack.position.x < 0 || attack.position.x > 16 || attack.position.z < 0 || attack.position.z > 16) {
      if (attack.state === 'REFLECTED') game.consecutiveReflections = 0
      engine.removeEntity(attack.entity)
      game.attacks.splice(i, 1)
    }
  }
  if (game.phase === 'REFLECT' && game.bossHealth <= 0) beginExecution()
}

function beginExecution() {
  game.phase = 'EXECUTION'
  game.phaseTime = 0
  game.attackCooldown = 2.5
  game.attacks.forEach((attack) => engine.removeEntity(attack.entity))
  game.attacks.length = 0
  warn('REACTOR EXPOSED - STRIKE IT THREE TIMES', 3)
  Material.setPbrMaterial(bossCore, { albedoColor: color('#fff06aff') })
}

function restartGame() {
  game.phase = 'AWAKENING'
  game.phaseTime = 0
  game.elapsed = 0
  game.remainingTime = ENCOUNTER_DURATION_SECONDS
  game.playerHealth = PLAYER_MAX_HEALTH
  game.bossHealth = BOSS_MAX_HEALTH
  game.shield = 100
  game.generators = [0, 0, 0]
  game.reactorHits = 0
  game.attackCooldown = 2.5
  game.warning = 'THE NULL KING AWAKENS'
  game.warningTime = 3
  game.lastDamageTime = -10
  game.consecutiveReflections = 0
  game.achievement = false
  game.ended = false
  game.attacks.forEach((attack) => engine.removeEntity(attack.entity))
  game.attacks.length = 0
  generatorLights.forEach((light) => Material.setPbrMaterial(light, { albedoColor: color('#27e6ffff') }))
  Material.setPbrMaterial(shieldRing, { albedoColor: color('#182a4d66') })
  Material.setPbrMaterial(bossCore, { albedoColor: color('#ff334dff') })
}

function tryCoreHit() {
  if (game.phase !== 'EXECUTION' || distance(playerPosition(), Vector3.create(8, 2.5, 8)) > 3.5) return
  if (
    inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN) ||
    inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_DOWN)
  ) {
    game.reactorHits += 1
    game.bossHealth = Math.max(0, game.bossHealth - 10)
    warn(`REACTOR HIT ${game.reactorHits}/3`, 0.8)
    if (game.reactorHits >= 3) {
      game.phase = 'VICTORY'
      game.ended = true
      warn('NULL KING PURGED', 99)
      Material.setPbrMaterial(bossCore, { albedoColor: color('#7dff9aff') })
    }
  }
}

function syncHud() {
  hud.phase = game.phase
  hud.playerHealth = game.playerHealth
  hud.bossHealth = game.bossHealth
  hud.shield = game.shield
  hud.generator1 = game.generators[0]
  hud.generator2 = game.generators[1]
  hud.generator3 = game.generators[2]
  hud.reactorHits = game.reactorHits
  hud.elapsed = game.elapsed
  hud.remainingTime = game.remainingTime
  hud.warning = game.warningTime > 0 ? game.warning : ''
  hud.achievement = game.achievement
  hud.ended = game.ended
}

function phaseSystem(dt: number) {
  if (game.ended) {
    if (
      inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN) ||
      inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_DOWN)
    ) {
      restartGame()
      syncHud()
    }
    return
  }
  game.elapsed += dt
  game.phaseTime += dt
  game.remainingTime = Math.max(0, game.remainingTime - dt)
  game.warningTime = Math.max(0, game.warningTime - dt)
  if (game.remainingTime <= 0) {
    game.phase = 'DEFEAT'
    game.ended = true
    warn('TIME EXPIRED - FIREWALL COLLAPSED', 99)
    game.attacks.forEach((attack) => engine.removeEntity(attack.entity))
    game.attacks.length = 0
  } else {
    game.attackCooldown -= dt

    if (game.phase === 'AWAKENING' && game.phaseTime > 5) {
      game.phase = 'SHIELD'
      game.phaseTime = 0
      game.attackCooldown = 2
      warn('BREAK THE SHIELD - ACTIVATE ALL THREE GENERATORS', 4)
    }
    if (game.phase === 'AWAKENING' || game.phase === 'SHIELD') {
      if (game.attackCooldown <= 0) {
        spawnAttack(game.phase === 'AWAKENING' ? (Math.random() > 0.5 ? 'laser' : 'blast') : 'blast')
        game.attackCooldown = game.phase === 'AWAKENING' ? 2.2 : 1.6
        warn(game.phase === 'AWAKENING' ? 'LASER SWEEP - MOVE' : 'INCOMING ENERGY BLAST', 0.75)
      }
    } else if (game.phase === 'REFLECT') {
      if (game.attackCooldown <= 0) {
        spawnAttack('projectile')
        game.attackCooldown = 1.15
        warn('REFLECT NOW - HOLD F', 0.65)
      }
    }
    updateAttacks(dt)
    tryCoreHit()
  }
  syncHud()
}

function pulseSystem(dt: number) {
  const pulse = 1 + Math.sin(game.elapsed * 5) * 0.08
  const coreTransform = Transform.getMutable(bossCore)
  coreTransform.scale = Vector3.create(pulse, pulse, pulse)
  const eyeTransform = Transform.getMutable(bossEye)
  eyeTransform.position = Vector3.create(8, 3.6 + Math.sin(game.elapsed * 3) * 0.08, 7)
  bossOrbiters.forEach((orbiter, index) => {
    const angle = game.elapsed * 1.6 + (Math.PI * 2 * index) / bossOrbiters.length
    Transform.getMutable(orbiter).position = Vector3.create(
      8 + Math.cos(angle) * 2.15,
      2.5 + Math.sin(game.elapsed * 2 + index) * 0.18,
      8 + Math.sin(angle) * 2.15
    )
  })
}

export function main() {
  console.log('[NULL-KING][BOOT] main() entered')
  buildArena()
  console.log('[NULL-KING][BOOT] arena created', {
    generatorCount: generatorEntities.length,
    generatorLightCount: generatorLights.length,
    bossCore,
    bossEye,
    shieldRing,
    playerEntity: engine.PlayerEntity,
  })
  try {
    console.log('[NULL-KING][BOOT] player transform', Transform.get(engine.PlayerEntity).position)
  } catch (error) {
    console.error('[NULL-KING][BOOT] player transform unavailable', error)
  }
  setupUi()
  console.log('[NULL-KING][BOOT] HUD registered')
  hud.warning = 'THE NULL KING AWAKENS'
  engine.addSystem(phaseSystem)
  engine.addSystem(pulseSystem)
  let lastPlayerPosition: Vector3 | null = null
  engine.addSystem(() => {
    const current = playerPosition()
    let dx = 0
    let dz = 0
    if (lastPlayerPosition) {
      dx = current.x - lastPlayerPosition.x
      dz = current.z - lastPlayerPosition.z
    }
    lastPlayerPosition = Vector3.create(current.x, current.y, current.z)

    if (!inputSystem.isTriggered(InputAction.IA_JUMP, PointerEventType.PET_DOWN) || game.ended) return

    let directionLength = Math.hypot(dx, dz)
    if (directionLength <= 0.01) {
      // A stationary dodge moves away from the boss; at arena center use -Z as a stable fallback.
      dx = current.x - ARENA_CENTER.x
      dz = current.z - ARENA_CENTER.z
      directionLength = Math.hypot(dx, dz)
      if (directionLength <= 0.01) {
        dx = 0
        dz = -1
        directionLength = 1
      }
    }
    Physics.applyImpulseToPlayer(Vector3.create(dx / directionLength, 0, dz / directionLength), 3)
    warn('DODGE', 0.35)
  })
  console.log('[NULL-KING][BOOT] systems registered')
}
