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
    useMemo(() => {
        Promise.all([
            fetchTranslations(),
            fetchStaticSpawnsPerMap(),
            fetchContainerContentPerMap(),
            fetchAllItemMetadata(),
            fetchLooseLootPerMap(),
            fetchAllMapMetadata(),
        ])
            .then(
                ([
                    translationsValue,
                    staticSpawnsPerMapValue,
                    containerContentPerMapValue,
                    allItemMetadataValue,
                    looseLootPerMapValue,
                    allMapMetadataValue,
                ]) => {
                    translations.value = translationsValue;
                    staticSpawnsPerMap.value = staticSpawnsPerMapValue;
                    containerContentPerMap.value = containerContentPerMapValue;
                    allItemMetadata.value = allItemMetadataValue;
                    looseLootPerMap.value = looseLootPerMapValue;
                    allMapMetadata.value = allMapMetadataValue;
                },
            )
            .catch((err: unknown) => {
                console.error(err);
            });
    }, []);

    return (
        <div className={'h-screen w-screen'}>
            <LootSpawnsMap />
        </div>
    );
}
