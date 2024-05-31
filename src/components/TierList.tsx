import { useComputed, useSignal } from '@preact/signals';
import { Location } from '../model/loot-data';
import { allItemMetadata, averageSpawnsPerMap } from '../store/state';
import { ItemMetadata } from '../model/item-metadata';

interface FrontendItemData extends ItemMetadata {
    pricePerSlot: number;
    averageCount: number;
    medianPrice: number;
}

const tierMetadata = [
    { name: 'Common', color: 'gray' },
    { name: 'Uncommon', color: 'green' },
    { name: 'Rare', color: 'blue' },
    { name: 'Epic', color: 'purple' },
    { name: 'Legendary', color: 'orange' },
];

export function TierList() {
    const selectedMaps = useSignal(Object.values(Location));
    const minPricePerSlot = useSignal(1000);

    const tierPercentiles = useSignal([0.875, 0.95, 0.975, 0.985, 1]);
    const itemsPerTier = useSignal(20);

    const averageSpawns = useComputed(() => {
        const averageSpawns = new Map<string, number>();

        for (const map of selectedMaps.value) {
            const averageSpawnsForMap = averageSpawnsPerMap.value.get(map);
            if (!averageSpawnsForMap) {
                continue;
            }

            for (const [item, count] of averageSpawnsForMap) {
                averageSpawns.set(item, (averageSpawns.get(item) ?? 0) + count);
            }
        }

        return averageSpawns;
    });

    const averageSpawnsWithMetadata = useComputed(() => {
        const averageSpawnsWithMetadata: FrontendItemData[] = [];

        for (const [item, averageCount] of averageSpawns.value) {
            const metadata = allItemMetadata.value.get(item);
            if (!metadata) {
                continue;
            }

            const medianPrice = metadata.historicalPrices.map((price) => price.price).sort()[
                Math.floor(metadata.historicalPrices.length / 2)
            ];

            const itemData: FrontendItemData = {
                ...metadata,
                averageCount,
                medianPrice,
                pricePerSlot: Math.round(medianPrice / (metadata.width * metadata.height)),
            };

            averageSpawnsWithMetadata.push(itemData);
        }

        return averageSpawnsWithMetadata;
    });

    const tiers = useComputed(() => {
        const filteredItems = averageSpawnsWithMetadata.value.filter(
            (item) => item.pricePerSlot >= minPricePerSlot.value,
        );
        const spawnrates = filteredItems.map((item) => item.averageCount);
        const spawnRatesMax = Math.max(...spawnrates);
        const spawnRatesMin = Math.min(...spawnrates);

        const tierBoundaries = tierPercentiles.value.map(
            (percentile) => spawnRatesMax - (spawnRatesMax - spawnRatesMin) * percentile,
        );

        const itemsSortedBySpawnrate = filteredItems.sort((a, b) => b.averageCount - a.averageCount);

        return itemsSortedBySpawnrate
            .reduce(
                (tiers, item) => {
                    const tierIndex = tierBoundaries.findIndex((boundary) => item.averageCount >= boundary);
                    if (tierIndex === -1) {
                        return tiers;
                    }

                    tiers[tierIndex].push(item);

                    return tiers;
                },
                tierBoundaries.map(() => [] as FrontendItemData[]),
            )
            .map((tier) => tier.sort((a, b) => b.pricePerSlot - a.pricePerSlot).slice(0, itemsPerTier.value));
    });

    return (
        <div className={'flex flex-col gap-32'}>
            {tiers.value.map((tier, index) => (
                <div className={'flex flex-col gap-16'}>
                    <h2 className={'text-3xl font-bold text-white'}>{tierMetadata[index].name}</h2>
                    <div className={'grid grid-cols-3 gap-8'}>
                        {tier.map((item) => (
                            <div key={item.id} className={'flex flex-col gap-2 p-4 bg-gray-900 rounded-lg'}>
                                <img src={item.iconLink} alt={item.shortName} className={'w-32 h-32 object-cover'} />
                                <div className={'flex flex-col gap-2'}>
                                    <span className={'text-white'}>{item.shortName}</span>
                                    <span className={'text-white'}>
                                        {item.pricePerSlot} ({item.averageCount})
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
