export interface ItemMetadata {
    id: string;
    shortName: string;
    iconLink: string;
    width: number;
    height: number;
    types: string[];
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
