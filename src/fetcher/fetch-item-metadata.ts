import { ItemMetadata, isItemMetadata } from '../model/item-metadata';

export async function fetchAllItemMetadata(): Promise<Map<ItemMetadata['id'], ItemMetadata>> {
    // todo: throwing away any notion of type safety here

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
    const { data } = await (response.json() as Promise<{ data: { items: unknown[] } }>);

    if (!isItemMetadata(data.items[0])) {
        throw new Error('invalid item metadata');
    }

    return new Map((data.items as ItemMetadata[]).map((item) => [item.id, item]));
}
