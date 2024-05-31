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
    shortName: string;
    iconLink: string;
    width: number;
    height: number;
    types: ItemType[];
    lastLowPrice: number;
    historicalPrices: {
        price: number;
        timestamp: number;
    }[];
}

export function isItemMetadata(data: unknown): data is ItemMetadata {
    return (
        typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        typeof data.id === 'string' &&
        'shortName' in data &&
        typeof data.shortName === 'string' &&
        'iconLink' in data &&
        typeof data.iconLink === 'string' &&
        'width' in data &&
        typeof data.width === 'number' &&
        'height' in data &&
        typeof data.height === 'number' &&
        'types' in data &&
        Array.isArray(data.types) &&
        data.types.every((type) => typeof type === 'string') &&
        'lastLowPrice' in data &&
        typeof data.lastLowPrice === 'number' &&
        'historicalPrices' in data &&
        Array.isArray(data.historicalPrices)
    );
}
