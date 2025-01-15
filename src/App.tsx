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

export function App() {
    // fetch all data on app load, components should implement loading states as needed
    useMemo(() => {
        // todo: these should really have some kind of error handling/maybe retries?

        void fetchTranslations().then((translationsValue) => {
            translations.value = translationsValue;
        });

        void fetchStaticSpawnsPerMap().then((staticSpawnsPerMapValue) => {
            staticSpawnsPerMap.value = staticSpawnsPerMapValue;
        });

        void fetchContainerContentPerMap().then((containerContentPerMapValue) => {
            containerContentPerMap.value = containerContentPerMapValue;
        });

        void fetchAllItemMetadata().then((allItemMetadataValue) => {
            allItemMetadata.value = allItemMetadataValue;
        });

        void fetchLooseLootPerMap().then((looseLootPerMapValue) => {
            looseLootPerMap.value = looseLootPerMapValue;
        });

        void fetchAllMapMetadata().then((allMapMetadataValue) => {
            allMapMetadata.value = allMapMetadataValue;
        });
    }, []);

    return (
        <div className={'h-screen w-screen'}>
            <LootSpawnsMap />
        </div>
    );
}
