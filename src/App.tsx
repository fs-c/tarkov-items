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
import { useSignal } from '@preact/signals';
import { Location, mapLocationToDisplayName } from './model/location';
import { twMerge as tw } from 'tailwind-merge';
import { fetchTranslations } from './fetcher/fetch-translations';
import { fetchLooseLootPerMap } from './fetcher/fetch-loose-loot';

function callAndLogTime<T>(fn: () => Promise<T>, name: string): Promise<T> {
    const startTime = performance.now();
    return fn().then((result) => {
        console.log(`${name} took ${performance.now() - startTime}ms`);
        return result;
    });
}

export function App() {
    // fetch all data on app load, components should implement loading states as needed
    useMemo(() => {
        // todo: these should really have some kind of error handling/maybe retries?

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
    const selectedLocation = useSignal(Location.Lighthouse);

    return (
        <div className={'relative h-screen w-screen bg-stone-900'}>
            <div className={'absolute z-10 w-full overflow-x-auto text-sm'}>
                <div
                    className={
                        'm-4 flex h-fit w-max flex-row gap-2 rounded-xl bg-stone-800/50 px-2 py-2 backdrop-blur-sm'
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
            </div>

            <LootSpawnsMap map={selectedLocation} />
        </div>
    );
}
