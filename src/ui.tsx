import ReactEcs, { Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

export const hud = {
  phase: 'AWAKENING',
  playerHealth: 100,
  bossHealth: 100,
  shield: 100,
  generator1: 0,
  generator2: 0,
  generator3: 0,
  reactorHits: 0,
  elapsed: 0,
  remainingTime: 300,
  warning: '',
  achievement: false,
  ended: false,
}

const bar = (value: number, width: number, fill: string) => (
  <UiEntity
    uiTransform={{ width, height: 18, margin: '4px 0' }}
    uiBackground={{ color: Color4.fromHexString('#17243ddd') }}
  >
    <UiEntity
      uiTransform={{ width: Math.max(0, Math.min(width, (width * value) / 100)), height: 18 }}
      uiBackground={{ color: Color4.fromHexString(fill) }}
    />
  </UiEntity>
)

const phaseNumber = (phase: string) => {
  if (phase === 'AWAKENING') return 1
  if (phase === 'SHIELD') return 2
  if (phase === 'REFLECT') return 3
  return 4
}

const phaseInstructions = () => {
  if (hud.phase === 'AWAKENING') return 'Defeat the King before 5:00. Move with WASD or left stick; Space dodges with your movement or away if still.'
  if (hud.phase === 'SHIELD') return 'Reach each cyan generator (within 3m) and press E once. Synchronize all three to break the shield.'
  if (hud.phase === 'REFLECT') return 'Hold F as a bolt reaches you. It only damages the boss when the reflected bolt returns to the core.'
  if (hud.phase === 'EXECUTION') return 'Approach the exposed core (within 3.5m), then press E or click it three times.'
  if (hud.phase === 'VICTORY') return 'Victory! You restored the firewall. Press E or click to restart.'
  return hud.warning.includes('TIME EXPIRED')
    ? 'Time expired. Press E or click to restart and try again.'
    : 'Your health reached zero. Press E or click to restart and try again.'
}

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = String(safeSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainder}`
}

const uiComponent = () => {
  const phaseName = hud.phase === 'VICTORY' || hud.phase === 'DEFEAT' ? hud.phase : `PHASE ${phaseNumber(hud.phase)} OF 4 - ${hud.phase}`
  const timeColor = hud.remainingTime <= 60 ? '#ff7187ff' : '#ffe36aff'
  const resultTitle = hud.phase === 'VICTORY' ? 'VICTORY - FIREWALL RESTORED' : `DEFEAT - ${hud.warning.includes('TIME EXPIRED') ? 'TIME EXPIRED' : 'FIREWALL COLLAPSED'}`

  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center' }}>
      <UiEntity
        uiTransform={{ width: 640, height: 205, margin: '16px 0 0 0', padding: 14, flexDirection: 'column' }}
        uiBackground={{ color: Color4.fromHexString('#050a17f2') }}
      >
        <Label value="THE LAST FIREWALL // NULL KING" fontSize={24} color={Color4.fromHexString('#b9f7ffff')} uiTransform={{ width: '100%', height: 30 }} />
        <UiEntity uiTransform={{ width: '100%', height: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label value={phaseName} fontSize={21} color={Color4.fromHexString('#ffffffee')} uiTransform={{ width: 390, height: 32 }} />
          <Label value={`TIME LEFT ${formatTime(hud.remainingTime)}`} fontSize={23} color={Color4.fromHexString(timeColor)} uiTransform={{ width: 205, height: 32 }} />
        </UiEntity>
        <Label value={`NULL KING HEALTH  ${hud.bossHealth}%`} fontSize={17} color={Color4.fromHexString('#ff7187ff')} uiTransform={{ width: '100%', height: 22 }} />
        {bar(hud.bossHealth, 600, '#ff3e63ff')}
        <Label value={`PLAYER HEALTH  ${hud.playerHealth}%`} fontSize={17} color={Color4.fromHexString('#7dff9aff')} uiTransform={{ width: '100%', height: 22 }} />
        {bar(hud.playerHealth, 600, '#39d98aff')}
      </UiEntity>

      <Label value={phaseInstructions()} fontSize={19} color={Color4.fromHexString('#ffffffff')} uiTransform={{ width: 1100, height: 44, margin: '8px 0 0 0' }} />
      <Label value={hud.warning} fontSize={23} color={Color4.fromHexString('#ffe36aff')} uiTransform={{ width: 900, height: 38, margin: '4px 0 0 0' }} />

      <UiEntity
        uiTransform={{ width: 300, height: 112, positionType: 'absolute', position: { right: 32, bottom: 28 }, padding: 12, flexDirection: 'column' }}
        uiBackground={{ color: Color4.fromHexString('#081226ee') }}
      >
        <Label value="SHIELD GENERATORS" fontSize={17} color={Color4.fromHexString('#77edffff')} uiTransform={{ width: '100%', height: 22 }} />
        <Label value={`A  ${hud.generator1}%     B  ${hud.generator2}%`} fontSize={16} color={Color4.fromHexString('#ffffffee')} uiTransform={{ width: '100%', height: 22 }} />
        <Label value={`C  ${hud.generator3}%`} fontSize={16} color={Color4.fromHexString('#ffffffee')} uiTransform={{ width: '100%', height: 22 }} />
      </UiEntity>
      <UiEntity
        uiTransform={{ width: 330, height: 84, positionType: 'absolute', position: { left: 32, bottom: 28 }, padding: 12, flexDirection: 'column' }}
        uiBackground={{ color: Color4.fromHexString('#081226ee') }}
      >
        <Label value="MOVE: WASD / LEFT STICK" fontSize={16} color={Color4.fromHexString('#ffffffee')} uiTransform={{ width: '100%', height: 24 }} />
        <Label value="SPACE: DODGE  |  E: INTERACT  |  F: REFLECT" fontSize={15} color={Color4.fromHexString('#9db3d9ff')} uiTransform={{ width: '100%', height: 24 }} />
      </UiEntity>
      <Label value={hud.phase === 'EXECUTION' ? `CORE HITS ${hud.reactorHits}/3` : hud.phase === 'REFLECT' ? 'REFLECTED BOLTS MUST HIT THE CORE' : ''} fontSize={20} color={Color4.fromHexString('#ffffffee')} uiTransform={{ width: 600, height: 30, margin: '12px 0 0 0' }} />
      <Label value={hud.achievement ? 'HIDDEN ACHIEVEMENT: THREE SUCCESSFUL REFLECTIONS' : ''} fontSize={16} color={Color4.fromHexString('#ffe36aff')} uiTransform={{ width: 700, height: 24, margin: '8px 0 0 0' }} />

      <UiEntity
        uiTransform={{ width: 760, height: 112, positionType: 'absolute', position: { top: 450 }, padding: 16, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        uiBackground={{ color: Color4.fromHexString('#040812ee') }}
      >
        <Label value={hud.phase === 'VICTORY' || hud.phase === 'DEFEAT' ? resultTitle : ''} fontSize={26} color={Color4.fromHexString(hud.phase === 'VICTORY' ? '#7dff9aff' : '#ff7187ff')} uiTransform={{ width: '100%', height: 42 }} />
        <Label value={hud.ended ? 'Press E or click to restart' : ''} fontSize={19} color={Color4.fromHexString('#ffffffff')} uiTransform={{ width: '100%', height: 30 }} />
      </UiEntity>
    </UiEntity>
  )
}

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(uiComponent)
}
