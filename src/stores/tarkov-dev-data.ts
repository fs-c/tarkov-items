import { signal } from '@preact/signals';

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

export const getItemMetadata = async (): Promise<Map<ItemMetadata['id'], ItemMetadata>> => {
    const response = await fetch('https://api.tarkov.dev/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `{
            items {
                id
                shortName
                iconLink
                width
                height
                types
                lastLowPrice
                historicalPrices {
                price
                timestamp
                }
            }
            }`,
        }),
    });

    const { data } = await response.json();

    return new Map(data.items.map((item: ItemMetadata) => [item.id, item]));
};

export const itemMetadata = signal<Map<ItemMetadata['id'], ItemMetadata> | null>(null);
