import { computed } from '@preact/signals';
import { staticSpawnsPerMap, containerContentPerMap, translations } from '../loot-data';
import { Location } from '../../model/loot-data';
import { normalizeProbabilities } from '../../util';

const averageContainersPerMap = computed(() => {
    const averageContainersPerMap = new Map<Location, Map<string, number>>();

    for (const map of Object.values(Location)) {
        const averageContainers = new Map<string, number>();

        const staticContainers = staticSpawnsPerMap.value.get(map)?.staticContainers;
        if (!staticContainers) {
            console.warn(`missing staticContainers for ${map}`);
            continue;
        }

        for (const container of staticContainers) {
            const containerTpl = container.template.Items[0]._tpl;
            // we normalize to the translated name early here since some containers have the same name
            // but different ids, and we want to treat them as being the same here
            const containerName = translations.value.get(containerTpl) ?? containerTpl;

            averageContainers.set(containerName, (averageContainers.get(containerName) ?? 0) + container.probability);
        }

        averageContainersPerMap.set(map, averageContainers);
    }

    return averageContainersPerMap;
});

const averageItemsPerContainerPerMap = computed(() => {
    const averageItemsPerContainerPerMap = new Map<Location, Map<string, Map<string, number>>>();

    for (const map of Object.values(Location)) {
        const averageItemsPerContainer = new Map<string, Map<string, number>>();

        const containerContent = containerContentPerMap.value.get(map);
        if (!containerContent) {
            console.warn(`missing containerContent for ${map}`);
            continue;
        }

        for (const [containerId, content] of Object.entries(containerContent)) {
            const averageItems = new Map<string, number>();

            const normalizedItemDistribution = normalizeProbabilities(content.itemDistribution);

            for (const item of normalizedItemDistribution) {
                averageItems.set(item.tpl, item.probability);
            }

            // need to resolve to name here since we also do it for container count
            const containerName = translations.value.get(containerId) ?? containerId;
            averageItemsPerContainer.set(containerName, averageItems);
        }

        averageItemsPerContainerPerMap.set(map, averageItemsPerContainer);
    }

    return averageItemsPerContainerPerMap;
});

export const averageSpawnsPerMap = computed(() => {
    const averageSpawnsPerMap = new Map<Location, Map<string, number>>();

    for (const map of Object.values(Location)) {
        const averageContainers = averageContainersPerMap.value.get(map);
        const averageItemsPerContainer = averageItemsPerContainerPerMap.value.get(map);

        if (!averageContainers || !averageItemsPerContainer) {
            console.warn(`missing data for ${map}`, { averageContainers, averageItemsPerContainer });
            continue;
        }

        const averageSpawns = new Map<string, number>();

        for (const [container, averageContainerCount] of averageContainers) {
            const items = averageItemsPerContainer.get(container);
            if (!items) {
                console.warn(`missing items for ${container}`);
                continue;
            }

            for (const [item, averageItemCount] of items) {
                averageSpawns.set(item, (averageSpawns.get(item) ?? 0) + averageItemCount * averageContainerCount);
            }
        }

        averageSpawnsPerMap.set(map, averageSpawns);
    }

    return averageSpawnsPerMap;
});
