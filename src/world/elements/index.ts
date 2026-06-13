import type { Scene } from 'three';
import type { ElementDef } from '../LevelData';
import type { PhysicsWorld } from '../../physics/PhysicsWorld';
import type { CharacterController } from '../../physics/CharacterController';
import type { LevelElement } from '../Level';
import { Door } from './Door';
import { Cube } from './Cube';
import { ButtonPlate } from './ButtonPlate';
import { Platform } from './Platform';
import { ToxicPool, Crusher } from './Hazard';
import { Terminal } from './Terminal';
import { LightZone } from './LightZone';
import { Breaker } from './Breaker';

export { Door, Cube, ButtonPlate, Platform, ToxicPool, Crusher, Terminal, LightZone, Breaker };

export function buildElement(
  def: ElementDef,
  scene: Scene,
  physics: PhysicsWorld,
  player: CharacterController,
): LevelElement {
  switch (def.type) {
    case 'door':
      return new Door(def.id, def.pos, def.size, def.open ?? false, def.exit ?? false, scene, physics);
    case 'cube':
      return new Cube(def.id, def.pos, scene, physics);
    case 'button':
      return new ButtonPlate(def.id, def.pos, scene, physics, player);
    case 'platform':
      return new Platform(
        def.id, def.pos, def.size, def.to, def.period,
        def.active ?? true, def.material ?? 'metal', scene, physics,
      );
    case 'toxic':
      return new ToxicPool(def.id, def.pos, def.size, scene, player);
    case 'crusher':
      return new Crusher(
        def.id, def.pos, def.size, def.travel, def.period,
        def.phase ?? 0, def.active ?? true, scene, physics, player,
      );
    case 'terminal':
      return new Terminal(def.id, def.pos, def.dir, def.loreId, scene);
    case 'lightZone':
      return new LightZone(def.id, def.pos, def.size, def.active ?? true, scene);
    case 'breaker':
      return new Breaker(def.id, def.pos, def.dir, scene);
  }
}
