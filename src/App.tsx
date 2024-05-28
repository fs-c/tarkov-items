import { computed, signal } from '@preact/signals';
import { Location, averageContainersPerMap, averageItemsPerContainerPerMap } from './stores/spt-data.store';
import { useEffect } from 'preact/hooks';
import { ItemMetadata, getItemsMetadata, itemsMetadata } from './stores/tarkov-dev-data';

export const App = () => {
    const selectedMaps = signal(Object.values(Location));
    const minPricePerSlot = signal(1000);

    const tierPercentiles = signal([0.4, 0.7, 0.85, 0.95, 1]);
    const itemsPerTier = signal(20);

    useEffect(() => {
        getItemsMetadata().then((metadata) => (itemsMetadata.value = metadata));
    }, []);

    const averageItemsPerContainer = computed(() => {
        const averageItemsPerContainer = new Map<string, Map<string, number>>();

        for (const map of selectedMaps.value) {
            const averageItemsPerContainerForMap = averageItemsPerContainerPerMap.value.get(map);
            if (!averageItemsPerContainerForMap) {
                continue;
            }

            for (const [container, items] of averageItemsPerContainerForMap) {
                if (!averageItemsPerContainer.has(container)) {
                    averageItemsPerContainer.set(container, new Map<string, number>());
                }

                for (const [item, count] of items) {
                    averageItemsPerContainer
                        .get(container)!
                        .set(item, averageItemsPerContainer.get(container)!.get(item) ?? 0 + count);
                }
            }
        }

        console.log({ averageItemsPerContainer });

        return averageItemsPerContainer;
    });

    const averageContainers = computed(() => {
        const averageContainers = new Map<string, number>();

        for (const map of selectedMaps.value) {
            const averageContainersForMap = averageContainersPerMap.value.get(map);
            if (!averageContainersForMap) {
                continue;
            }

            for (const [container, count] of averageContainersForMap) {
                averageContainers.set(container, averageContainers.get(container) ?? 0 + count);
            }
        }

        console.log({ averageContainers });

        return averageContainers;
    });

    const averageItems = computed(() => {
        const averageItems = new Map<string, number>();

        for (const [container, items] of averageItemsPerContainer.value) {
            const containerCount = averageContainers.value.get(container);
            if (!containerCount) {
                continue;
            }

            for (const [item, count] of items) {
                averageItems.set(item, averageItems.get(item) ?? 0 + count * containerCount);
            }
        }

        console.log({ averageItems });

        return averageItems;
    });

    const averageItemsWithMetadata = computed(() => {
        const averageItemsWithMetadata: { count: number; metadata: ItemMetadata }[] = [];

        for (const [itemId, count] of averageItems.value) {
            const metadata = itemsMetadata.value?.get(itemId);
            if (!metadata) {
                continue;
            }

            averageItemsWithMetadata.push({ count, metadata });
        }

        console.log({ averageItemsWithMetadata });

        return averageItemsWithMetadata.filter(
            (item) => item.metadata.lastLowPrice * item.count >= minPricePerSlot.value,
        );
    });

    const itemsGroupedByTier = computed(() => {
        // group by count percentile: 0-40%, 41-70%, 71-85%, 86-95%, 96-100%
        const sortedItems = averageItemsWithMetadata.value.sort((a, b) => b.count - a.count);
        return tierPercentiles.value.map((curPercentile, index) =>
            sortedItems.slice(
                Math.floor((tierPercentiles.value[index - 1] ?? 0) * sortedItems.length),
                Math.floor(curPercentile * sortedItems.length),
            ),
        );
    });

    const trimmedAndSortedTiers = computed(() => {
        return itemsGroupedByTier.value.map((tier) =>
            tier.sort((a, b) => b.metadata.lastLowPrice - a.metadata.lastLowPrice).slice(0, itemsPerTier.value),
        );
    });

    return (
        <div className={'min-h-screen bg-gray-800'}>
            {trimmedAndSortedTiers.value.map((tier, index) => (
                <div key={index} className={'flex flex-col'}>
                    <h2 className={'text-2xl text-white'}>{`Tier ${index + 1}`}</h2>
                    <div className={'grid grid-cols-4 gap-4'}>
                        {tier.map((item) => (
                            <div key={item.metadata.id} className={'bg-gray-900 p-4'}>
                                <img src={item.metadata.iconLink} alt={item.metadata.shortName} />
                                <p className={'text-white'}>{item.metadata.shortName}</p>
                                <p className={'text-white'}>{item.count}</p>
                                <p className={'text-white'}>{item.metadata.lastLowPrice}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
