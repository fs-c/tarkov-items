import { useComputed, useSignal } from '@preact/signals';
import { Location } from '../model/loot-data';
import { allItemMetadata, averageSpawnsPerMap } from '../store/state';
import { ItemMetadata } from '../model/item-metadata';

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

    const tierPercentiles = useSignal([0.4, 0.7, 0.85, 0.95, 1]);
    const itemsPerTier = useSignal(20);

    const averageSpawns = useComputed(() => {
        const averageSpawns = new Map<string, number>();

        for (const map of selectedMaps.value) {
            const averageSpawnsForMap = averageSpawnsPerMap.value.get(map);
            if (!averageSpawnsForMap) {
                continue;
            }

            console.log(`setting average spawns for ${map}`, averageSpawnsForMap);

            for (const [item, count] of averageSpawnsForMap) {
                averageSpawns.set(item, (averageSpawns.get(item) ?? 0) + count);
            }
        }

        return averageSpawns;
    });

    const averageSpawnsWithMetadata = useComputed(() => {
        const averageSpawnsWithMetadata: { averageCount: number; metadata: ItemMetadata }[] = [];

        for (const [item, averageCount] of averageSpawns.value) {
            const metadata = allItemMetadata.value.get(item);
            if (!metadata) {
                continue;
            }

            averageSpawnsWithMetadata.push({ averageCount, metadata });
        }

        return averageSpawnsWithMetadata;
    });

    const tiers = useComputed(() => {
        const filteredItems = averageSpawnsWithMetadata.value.filter(
            (item) => item.metadata.lastLowPrice >= minPricePerSlot.value,
        );
        const itemsSortedBySpawnrate = filteredItems.sort((a, b) => a.averageCount - b.averageCount);

        console.log({ itemsSortedBySpawnrate });

        const tiers = tierPercentiles.value.map((percentile, index) =>
            itemsSortedBySpawnrate.slice(
                Math.floor((tierPercentiles.value[index - 1] ?? 0) * itemsSortedBySpawnrate.length),
                Math.ceil(percentile * itemsSortedBySpawnrate.length),
            ),
        );

        return tiers.map((tier) =>
            tier.sort((a, b) => b.metadata.lastLowPrice - a.metadata.lastLowPrice).slice(0, itemsPerTier.value),
        );
    });

    return (
        <div className={'flex flex-col gap-32'}>
            {tiers.value.map((tier, index) => (
                <div className={'flex flex-col gap-16'}>
                    <h2 className={'text-3xl font-bold text-white'}>{tierMetadata[index].name}</h2>
                    <div className={'grid grid-cols-3 gap-8'}>
                        {tier.map((item) => (
                            <div key={item.metadata.id} className={'flex flex-col gap-2 p-4 bg-gray-900 rounded-lg'}>
                                <img
                                    src={item.metadata.iconLink}
                                    alt={item.metadata.shortName}
                                    className={'w-32 h-32 object-cover'}
                                />
                                <div className={'flex flex-col gap-2'}>
                                    <span className={'text-white'}>{item.metadata.shortName}</span>
                                    <span className={'text-white'}>{item.metadata.lastLowPrice}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
