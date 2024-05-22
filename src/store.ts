import { signal } from '@preact/signals';

export interface Item {
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

export type ItemData = Map<Item['id'], Item>;

export const itemData = signal<ItemData | null>(null);
