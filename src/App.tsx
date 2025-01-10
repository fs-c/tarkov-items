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
} from './store/loot-data';
import { fetchAllItemMetadata } from './fetcher/fetch-item-metadata';
import { LootSpawnsMap } from './components/LootSpawnsMap';

export function App() {
    useMemo(() => {
        Promise.all([
            fetchTranslations(),
            fetchStaticSpawnsPerMap(),
            fetchContainerContentPerMap(),
            fetchAllItemMetadata(),
            fetchLooseLootPerMap(),
        ])
            .then(
                ([
                    translationsValue,
                    staticSpawnsPerMapValue,
                    containerContentPerMapValue,
                    allItemMetadataValue,
                    looseLootPerMapValue,
                ]) => {
                    translations.value = translationsValue;
                    staticSpawnsPerMap.value = staticSpawnsPerMapValue;
                    containerContentPerMap.value = containerContentPerMapValue;
                    allItemMetadata.value = allItemMetadataValue;
                    looseLootPerMap.value = looseLootPerMapValue;
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
