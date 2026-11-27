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

const uiComponent = () => (
  <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center' }}>
    <UiEntity
      uiTransform={{ width: 520, height: 138, margin: '26px 0 0 0', padding: 14, flexDirection: 'column' }}
      uiBackground={{ color: Color4.fromHexString('#050a17dd') }}
    >
      <Label value="THE LAST FIREWALL // NULL KING" fontSize={22} color={Color4.fromHexString('#b9f7ffff')} uiTransform={{ width: '100%', height: 28 }} />
      <Label value={`PHASE: ${hud.phase}    TIME: ${hud.elapsed.toFixed(1)}s`} fontSize={17} color={Color4.fromHexString('#ffffffdd')} uiTransform={{ width: '100%', height: 24 }} />
      {bar(hud.bossHealth, 492, '#ff3e63ff')}
      <Label value={`BOSS CORE ${hud.bossHealth}%    PLAYER ${hud.playerHealth}%`} fontSize={15} color={Color4.fromHexString('#d4e2ffff')} uiTransform={{ width: '100%', height: 22 }} />
      {bar(hud.playerHealth, 492, '#39d98aff')}
    </UiEntity>
    <Label value={hud.warning} fontSize={24} color={Color4.fromHexString('#ffe36aff')} uiTransform={{ width: 900, height: 40, margin: '24px 0 0 0' }} />
    <UiEntity
      uiTransform={{ width: 300, height: 128, positionType: 'absolute', position: { right: 32, top: 170 }, padding: 12, flexDirection: 'column' }}
      uiBackground={{ color: Color4.fromHexString('#081226dd') }}
    >
      <Label value="SHIELD GENERATORS" fontSize={17} color={Color4.fromHexString('#77edffff')} uiTransform={{ width: '100%', height: 22 }} />
      <Label value={`A  ${hud.generator1}%`} fontSize={16} color={Color4.fromHexString('#ffffffdd')} uiTransform={{ width: '100%', height: 20 }} />
      <Label value={`B  ${hud.generator2}%`} fontSize={16} color={Color4.fromHexString('#ffffffdd')} uiTransform={{ width: '100%', height: 20 }} />
      <Label value={`C  ${hud.generator3}%`} fontSize={16} color={Color4.fromHexString('#ffffffdd')} uiTransform={{ width: '100%', height: 20 }} />
      <Label value="E: activate   F: reflect   SPACE: dodge" fontSize={13} color={Color4.fromHexString('#9db3d9ff')} uiTransform={{ width: '100%', height: 24 }} />
    </UiEntity>
    <Label value={hud.phase === 'EXECUTION' ? `CORE HITS ${hud.reactorHits}/3` : hud.phase === 'REFLECT' ? 'HOLD F at impact to reflect' : ''} fontSize={20} color={Color4.fromHexString('#ffffffdd')} uiTransform={{ width: 600, height: 30, margin: '12px 0 0 0' }} />
    <Label value={hud.achievement ? 'HIDDEN ACHIEVEMENT: TRIPLE REFLECTION' : ''} fontSize={16} color={Color4.fromHexString('#ffe36aff')} uiTransform={{ width: 600, height: 24, margin: '8px 0 0 0' }} />
    <UiEntity
      uiTransform={{ width: 700, height: 90, positionType: 'absolute', position: { top: 450 }, padding: 18, alignItems: 'center', justifyContent: 'center' }}
      uiBackground={{ color: Color4.fromHexString('#040812ee') }}
    >
      <Label value={hud.phase === 'VICTORY' ? 'FIREWALL RESTORED // E OR CLICK TO RESTART' : hud.phase === 'DEFEAT' ? 'FIREWALL COLLAPSED // E OR CLICK TO RESTART' : ''} fontSize={25} color={Color4.fromHexString(hud.phase === 'VICTORY' ? '#7dff9aff' : '#ff7187ff')} uiTransform={{ width: '100%', height: 45 }} />
    </UiEntity>
  </UiEntity>
)

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(uiComponent)
}
