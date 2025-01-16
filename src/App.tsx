import { useMemo } from 'preact/hooks';
import {
    fetchContainerContentPerMap,
    fetchLooseLootPerMap,
    fetchStaticSpawnsPerMap,
    fetchTranslations,
} from './fetcher/fetch-loot-data';
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

    return (
        <div className={'h-screen w-screen'}>
            <LootSpawnsMap />
        </div>
    );
}
