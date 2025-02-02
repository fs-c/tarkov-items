export enum ItemType {
    ammo = 'ammo',
    ammoBox = 'ammoBox',
    any = 'any',
    armor = 'armor',
    armorPlate = 'armorPlate',
    backpack = 'backpack',
    barter = 'barter',
    container = 'container',
    glasses = 'glasses',
    grenade = 'grenade',
    gun = 'gun',
    headphones = 'headphones',
    helmet = 'helmet',
    injectors = 'injectors',
    keys = 'keys',
    markedOnly = 'markedOnly',
    meds = 'meds',
    mods = 'mods',
    noFlea = 'noFlea',
    pistolGrip = 'pistolGrip',
    preset = 'preset',
    provisions = 'provisions',
    rig = 'rig',
    suppressor = 'suppressor',
    wearable = 'wearable',
}

export interface ItemMetadata {
    id: string;
    name: string;
    shortName: string;
    iconLink: string;
    types: ItemType[];
}

export function isItemMetadata(data: unknown): data is ItemMetadata {
    return (
        typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        typeof data.id === 'string' &&
        'name' in data &&
        typeof data.name === 'string' &&
        'shortName' in data &&
        typeof data.shortName === 'string' &&
        'iconLink' in data &&
        typeof data.iconLink === 'string' &&
        'types' in data &&
        Array.isArray(data.types)
    );
}
