import { useMemo } from 'preact/hooks';
import {
    fetchContainerContentPerMap,
    fetchStaticSpawnsPerMap,
    fetchTranslations,
} from './fetcher/fetch-loot-data';
import {
    translations,
    staticSpawnsPerMap,
    containerContentPerMap,
    allItemMetadata,
} from './store/loot-data';
import { fetchAllItemMetadata } from './fetcher/fetch-item-metadata';
import { RarityVisualization } from './components/RarityVisualization';

export function App() {
    useMemo(() => {
        Promise.all([
            fetchTranslations(),
            fetchStaticSpawnsPerMap(),
            fetchContainerContentPerMap(),
            fetchAllItemMetadata(),
        ])
            .then(
                ([
                    translationsValue,
                    staticSpawnsPerMapValue,
                    containerContentPerMapValue,
                    allItemMetadataValue,
                ]) => {
                    translations.value = translationsValue;
                    staticSpawnsPerMap.value = staticSpawnsPerMapValue;
                    containerContentPerMap.value = containerContentPerMapValue;
                    allItemMetadata.value = allItemMetadataValue;
                },
            )
            .catch((err: unknown) => {
                console.error(err);
            });
    }, []);

    return (
        <div className={'h-screen w-screen'}>
            <RarityVisualization />
        </div>
    );
}
