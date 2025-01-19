import { useMemo } from 'preact/hooks';
import {
    fetchContainerContentPerMap,
    fetchStaticSpawnsPerMap,
} from './fetcher/fetch-container-data';
import {
    translations,
    staticSpawnsPerMap,
    containerContentPerMap,
    allItemMetadata,
    looseLootPerMap,
    allMapMetadata,
} from './store/data';
import { fetchAllItemMetadata } from './fetcher/fetch-item-metadata';
import { LootSpawnsMap } from './components/LootSpawnsMap';
import { fetchAllMapMetadata } from './fetcher/fetch-map-metadata';
import { useComputed, useSignal } from '@preact/signals';
import { Location, mapLocationToDisplayName } from './model/location';
import { twMerge as tw } from 'tailwind-merge';
import { fetchTranslations } from './fetcher/fetch-translations';
import { fetchLooseLootPerMap } from './fetcher/fetch-loose-loot';
import { LooseLootSpawnpoint } from './model/loose-loot';
import { formatProbability } from './util/display';
import { MagnifyingGlass } from './components/lib/MagnifyingGlass';

function callAndLogTime<T>(fn: () => Promise<T>, name: string): Promise<T> {
    const startTime = performance.now();
    return fn().then((result) => {
        console.log(`${name} took ${performance.now() - startTime}ms`);
        return result;
    });
}

function useFetchAllData() {
    useMemo(() => {
        // todo: these should really have some kind of error handling, or maybe retries?

        void callAndLogTime(fetchTranslations, 'fetchTranslations').then((translationsValue) => {
            translations.value = translationsValue;
        });

        void callAndLogTime(fetchStaticSpawnsPerMap, 'fetchStaticSpawnsPerMap').then(
            (staticSpawnsPerMapValue) => {
                staticSpawnsPerMap.value = staticSpawnsPerMapValue;
            },
        );

        void callAndLogTime(fetchContainerContentPerMap, 'fetchContainerContentPerMap').then(
            (containerContentPerMapValue) => {
                containerContentPerMap.value = containerContentPerMapValue;
            },
        );

        void callAndLogTime(fetchAllItemMetadata, 'fetchAllItemMetadata').then(
            (allItemMetadataValue) => {
                allItemMetadata.value = allItemMetadataValue;
            },
        );

        void callAndLogTime(fetchLooseLootPerMap, 'fetchLooseLootPerMap').then(
            (looseLootPerMapValue) => {
                looseLootPerMap.value = looseLootPerMapValue;
            },
        );

        void callAndLogTime(fetchAllMapMetadata, 'fetchAllMapMetadata').then(
            (allMapMetadataValue) => {
                allMapMetadata.value = allMapMetadataValue;
            },
        );
    }, []);
}

const availableLocations = [
    Location.Lighthouse,
    Location.Customs,
    Location.FactoryDay,
    Location.Interchange,
    Location.Labs,
    Location.Reserve,
    Location.GroundZeroLow,
    Location.Shoreline,
    Location.Streets,
    Location.Woods,
];

export function App() {
    useFetchAllData();

    const selectedLocation = useSignal(Location.Lighthouse);

    const selectedSpawnpoint = useSignal<LooseLootSpawnpoint | undefined>(undefined);

    const mapMetadata = useComputed(() => {
        const metadata = allMapMetadata.value.get(selectedLocation.value);
        if (!metadata) {
            return undefined;
        }

        // we are assuming that we always want to get the first map, this might be an issue
        return metadata.maps[0];
    });

    const mapSpawnpoints = useComputed(() => {
        const looseLoot = looseLootPerMap.value.get(selectedLocation.value);
        if (!looseLoot) {
            return [];
        }

        return looseLoot.spawnpoints;
    });

    return (
        <div className={'relative h-screen w-screen bg-stone-900'}>
            <div className={'absolute z-10 flex w-full flex-row justify-between gap-8 text-sm'}>
                <div
                    className={
                        'm-4 flex h-[52px] w-max flex-row gap-2 rounded-xl bg-stone-800/50 p-2 backdrop-blur-sm'
                    }
                >
                    {availableLocations.map((location) => (
                        <button
                            key={location}
                            onClick={() => (selectedLocation.value = location)}
                            className={tw(
                                'rounded-lg px-4 py-2 font-semibold text-stone-300',
                                selectedLocation.value === location
                                    ? 'bg-stone-300 text-stone-800'
                                    : 'hover:bg-stone-300/10',
                            )}
                        >
                            {mapLocationToDisplayName(location)}
                        </button>
                    ))}
                </div>

                <button
                    className={
                        'm-4 flex h-[52px] flex-row items-center gap-3 rounded-xl bg-stone-800/50 px-4 py-2 backdrop-blur-sm hover:bg-stone-300/10'
                    }
                >
                    <MagnifyingGlass />

                    <p className={'text-stone-300'}>Search spawnpoints...</p>

                    <p className={'text-stone-300'}>
                        <span className={'font-semibold'}>Ctrl K</span>
                    </p>
                </button>
            </div>

            <LootSpawnsMap
                mapMetadata={mapMetadata}
                spawnpoints={mapSpawnpoints}
                $selectedSpawnpoint={selectedSpawnpoint}
            />

            {selectedSpawnpoint.value && (
                <div
                    class={
                        'absolute bottom-0 right-0 m-4 flex max-h-96 max-w-[400px] flex-col gap-2 rounded-lg bg-stone-800/50 pt-4 backdrop-blur-sm'
                    }
                >
                    <div class={'px-4 text-sm text-stone-300'}>
                        <span class={'font-semibold'}>
                            {formatProbability(selectedSpawnpoint.value.probability)}
                        </span>{' '}
                        spawn chance,{' '}
                        <span class={'font-semibold'}>{selectedSpawnpoint.value.items.length}</span>{' '}
                        items
                    </div>

                    <div class={'flex flex-row flex-wrap gap-2 overflow-y-auto px-4 pb-4'}>
                        {selectedSpawnpoint.value.items
                            .sort((a, b) => b.probability - a.probability)
                            .map((item) => (
                                <div
                                    class={
                                        'flex flex-row items-center gap-2 rounded-md bg-stone-900/70 p-1 pr-2'
                                    }
                                >
                                    <div
                                        class={
                                            'overflow-hidden rounded-md border border-stone-700/50'
                                        }
                                    >
                                        <img
                                            class={'h-8 w-8 [clip-path:inset(1px)]'}
                                            src={allItemMetadata.value.get(item.tpl)?.iconLink}
                                        />
                                    </div>

                                    <div class={'text-sm text-stone-300'}>
                                        {translations.value.get(item.tpl)}
                                    </div>

                                    <div class={'text-sm font-semibold text-stone-300'}>
                                        {formatProbability(item.probability)}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
