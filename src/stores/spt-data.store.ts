import rawTranslations from '../database/translations.json';
import rawMetadata from '../database/metadata.json';
import { computed, ReadonlySignal, signal, Signal } from '@preact/signals';

export type Translations = Map<string, string>;

export enum Location {
    Customs = 'bigmap',
    FactoryDay = 'factory4_day',
    FactoryNight = 'factory4_night',
    Interchange = 'interchange',
    Labs = 'laboratory',
    Lighthouse = 'lighthouse',
    Reserve = 'rezervbase',
    GroundZeroLow = 'sandbox',
    GroundZeroHigh = 'sandbox_high',
    Shoreline = 'shoreline',
    Streets = 'tarkovstreets',
    Woods = 'woods',
}

interface RawContainers {
    staticContainers: {
        probability: number;
        template: {
            Items: [
                {
                    _tpl: string;
                },
            ];
        };
    }[];
    // these are empty most of the time, but it might be interesting to consider
    // them as well
    staticWeapons: unknown[];
    staticForced: unknown[];
}

const isRawContainers = (data: unknown): data is RawContainers => {
    return (
        typeof data === 'object' &&
        data !== null &&
        'staticContainers' in data &&
        Array.isArray(data['staticContainers']) &&
        // should be `.every` but if one matches, chances are the rest will too
        data['staticContainers'].some((container) => {
            return (
                typeof container === 'object' &&
                container !== null &&
                'probability' in container &&
                typeof container['probability'] === 'number' &&
                'template' in container &&
                typeof container['template'] === 'object' &&
                'Items' in container['template'] &&
                Array.isArray(container['template']['Items']) &&
                container['template']['Items'].every((item) => {
                    return (
                        typeof item === 'object' && item !== null && '_tpl' in item && typeof item['_tpl'] === 'string'
                    );
                })
            );
        })
    );
};

interface RawLoot {
    [key: string]: {
        itemcountDistribution: {
            count: number;
            relativeProbability: number;
        }[];
        itemDistribution: {
            tpl: string;
            relativeProbability: number;
        }[];
    };
}

const isRawLoot = (data: unknown): data is RawLoot => {
    return (
        typeof data === 'object' &&
        data !== null &&
        // should be `.every` but if one matches, chances are the rest will too
        Object.values(data).some((value) => {
            return (
                'itemcountDistribution' in value &&
                Array.isArray(value['itemcountDistribution']) &&
                'itemDistribution' in value &&
                Array.isArray(value['itemDistribution'])
            );
        })
    );
};

const getTranslations = (): Translations => {
    const translations = new Map<string, string>();

    for (const [key, value] of Object.entries(rawTranslations)) {
        const [tpl, type] = key.split(' ');

        if (type === 'ShortName') {
            translations.set(tpl, value);
        }
    }

    return translations;
};

export const translations = signal(getTranslations());

const getLastUpdated = (): Date => {
    return new Date(rawMetadata.lastUpdated);
};

export const lastUpdated = signal(getLastUpdated());

const getAverageContainersForMap = async (map: Location): Promise<ReadonlySignal<Map<string, number>>> => {
    try {
        const rawContainersForMap = (await import(`../database/${map}/staticContainers.json`)).default;

        if (!isRawContainers(rawContainersForMap)) {
            console.error(rawContainersForMap);
            throw new Error('invalid raw container json');
        }

        return computed(() =>
            rawContainersForMap.staticContainers.reduce((containerCounts, currentContainer) => {
                // reduce id to name early here because there are multiple containers
                // with the same name but different ids (in particular noticeable
                // with various weapon crates) which we want to group together
                const containerName =
                    translations.value.get(currentContainer.template.Items[0]._tpl) ??
                    currentContainer.template.Items[0]._tpl;
                return containerCounts.set(
                    containerName,
                    (containerCounts.get(containerName) ?? 0) + currentContainer.probability,
                );
            }, new Map<string, number>()),
        );
    } catch (err: unknown) {
        console.error(`failed importing raw container json for ${map}:`, err);
        return signal(new Map());
    }
};

const getAverageContainersPerMap = async (): Promise<ReadonlySignal<Map<Location, Map<string, number>>>> => {
    const averageContainersPerMapSignal = new Map<Location, ReadonlySignal<Map<string, number>>>();

    for (const location of Object.values(Location)) {
        averageContainersPerMapSignal.set(location, await getAverageContainersForMap(location));
    }

    return computed(() => {
        const averageContainersPerMap = new Map<Location, Map<string, number>>();

        for (const [location, signal] of averageContainersPerMapSignal) {
            averageContainersPerMap.set(location, signal.value);
        }

        return averageContainersPerMap;
    });
};

export const averageContainersPerMap = await getAverageContainersPerMap();

const normalizeProbabilities = <T extends { relativeProbability: number }>(
    objectsWithRelativeProbabilities: T[],
): (Omit<T, 'relativeProbability'> & { probability: number })[] => {
    const relativeProbabilitiesSum = objectsWithRelativeProbabilities.reduce(
        (acc, cur) => (acc += cur.relativeProbability),
        0,
    );
    return objectsWithRelativeProbabilities.map((item) => ({
        ...item,
        probability: item.relativeProbability / relativeProbabilitiesSum,
    }));
};

const getAverageItemsPerContainerPerMap = async (): Promise<
    ReadonlySignal<Map<Location, Map<string, Map<string, number>>>>
> => {
    const rawLootPerMap = new Map<Location, RawLoot>();

    for (const map of Object.values(Location)) {
        try {
            const rawLootForMap = (await import(`../database/${map}/staticLoot.json`)).default;

            if (!isRawLoot(rawLootForMap)) {
                console.error(rawLootForMap);
                throw new Error('invalid raw loot json');
            }

            rawLootPerMap.set(map, rawLootForMap);
        } catch (err: unknown) {
            console.error(`failed importing raw loot json for ${map}:`, err);
        }
    }

    return computed(() => {
        const averageItemsPerContainerPerMap = new Map<Location, Map<string, Map<string, number>>>();

        for (const [map, rawLoot] of rawLootPerMap) {
            const averageItemsPerContainer = new Map<string, Map<string, number>>();

            for (const [containerId, containerLoot] of Object.entries(rawLoot)) {
                const averageItemCount = normalizeProbabilities(containerLoot.itemcountDistribution).reduce(
                    (averageCount, current) => (averageCount += current.count * current.probability),
                    0,
                );

                const normalizedItemProbabilities = normalizeProbabilities(containerLoot.itemDistribution);

                // see above for early name conversion reasoning
                const containerName = translations.value.get(containerId) ?? containerId;
                averageItemsPerContainer.set(
                    containerName,
                    // don't translate id here, we need it later to get the correct metadata
                    new Map(normalizedItemProbabilities.map((item) => [item.tpl, item.probability * averageItemCount])),
                );
            }

            averageItemsPerContainerPerMap.set(map, averageItemsPerContainer);
        }

        return averageItemsPerContainerPerMap;
    });
};

export const averageItemsPerContainerPerMap = await getAverageItemsPerContainerPerMap();
