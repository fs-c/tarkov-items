import { ContainerContent, StaticSpawns, Translations, Location } from '../model/loot-data';

function normalizeProbabilities<T extends { relativeProbability: number }>(
    objectsWithRelativeProbabilities: T[],
): (Omit<T, 'relativeProbability'> & { probability: number })[] {
    const relativeProbabilitiesSum = objectsWithRelativeProbabilities.reduce(
        (acc, cur) => (acc += cur.relativeProbability),
        0,
    );
    return objectsWithRelativeProbabilities.map((item) => ({
        ...item,
        probability: item.relativeProbability / relativeProbabilitiesSum,
    }));
}

function getAverageContainers(staticSpawns: StaticSpawns, translations: Translations): Map<string, number> {
    const averageContainers = new Map<string, number>();

    for (const container of staticSpawns.staticContainers) {
        const containerTpl = container.template.Items[0]._tpl;
        // we normalize to the translated name early here since some containers have the same name
        // but different ids, and we want to treat them as being the same here
        const containerName = translations.get(containerTpl) ?? containerTpl;

        averageContainers.set(containerName, (averageContainers.get(containerName) ?? 0) + container.probability);
    }

    return averageContainers;
}

function getAverageItemsPerContainer(
    containerContent: ContainerContent,
    translations: Translations,
): Map<string, Map<string, number>> {
    const averageItemsPerContainer = new Map<string, Map<string, number>>();

    for (const [containerId, content] of Object.entries(containerContent)) {
        const averageItems = new Map<string, number>();

        const normalizedItemDistribution = normalizeProbabilities(content.itemDistribution);

        for (const item of normalizedItemDistribution) {
            averageItems.set(item.tpl, item.probability);
        }

        // need to resolve to name here since we also do it for container count
        const containerName = translations.get(containerId) ?? containerId;
        averageItemsPerContainer.set(containerName, averageItems);
    }

    return averageItemsPerContainer;
}

export function mapLootDataToAverageSpawnsPerMap(
    staticSpawnsPerMap: Map<Location, StaticSpawns>,
    containerContentPerMap: Map<Location, ContainerContent>,
    translations: Translations,
): Map<Location, Map<string, number>> {
    const averageSpawnsPerMap = new Map<Location, Map<string, number>>();

    for (const map of Object.values(Location)) {
        const staticSpawns = staticSpawnsPerMap.get(map);
        const containerContent = containerContentPerMap.get(map);
        if (!staticSpawns || !containerContent) {
            console.warn(`missing data for ${map}`, { staticSpawns, containerContent });
            continue;
        }

        const averageContainers = getAverageContainers(staticSpawns, translations);
        const averageItemsPerContainer = getAverageItemsPerContainer(containerContent, translations);

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
}
