import { PointWithHeight } from './common';

export interface LooseLootItem {
    tpl: string;
    // chance that this particular item spawns, already including the spawnpoint probability
    // to get the spawn chance assuming that something spawned, divide by the spawnpoint probability
    probability: number;
}

export interface LooseLootSpawnpoint {
    position: PointWithHeight;
    // chance that anything spawns here
    probability: number;
    items: LooseLootItem[];
}

export interface LooseLoot {
    spawnpoints: LooseLootSpawnpoint[];
}
