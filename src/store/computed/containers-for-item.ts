import { computed } from '@preact/signals';
import { averageItemsPerContainerPerMap } from './spawns-per-map';

export const containersForItemPerMap = computed(() => {
    const containersForItemPerMap = new Map<
        string,
        Map<string, { container: string; average: number }[]>
    >();

    // this is just an inverted version of `averageItemsPerContainerPerMap`
    for (const [map, averageItemsPerContainer] of averageItemsPerContainerPerMap.value) {
        const containersForItem = new Map<string, { container: string; average: number }[]>();

        for (const [container, items] of averageItemsPerContainer) {
            for (const [item, probability] of items) {
                const containerList = containersForItem.get(item) ?? [];
                containerList.push({ container, average: probability });
                containersForItem.set(item, containerList);
            }
        }

        containersForItemPerMap.set(map, containersForItem);
    }

    return containersForItemPerMap;
});
