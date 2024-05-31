import { useMemo } from 'preact/hooks';
import { fetchContainerContentPerMap, fetchStaticSpawnsPerMap, fetchTranslations } from './fetcher/fetch-loot-data';
import { allItemMetadata, averageSpawnsPerMap, translations } from './store/state';
import { mapLootDataToAverageSpawnsPerMap } from './mapper/loot-data-to-rarity';
import { fetchAllItemMetadata } from './fetcher/fetch-item-metadata';
import { TierList } from './components/TierList';

export function App() {
    useMemo(() => {
        Promise.all([
            fetchTranslations(),
            fetchStaticSpawnsPerMap(),
            fetchContainerContentPerMap(),
            fetchAllItemMetadata(),
        ])
            .then(([translationsValue, staticSpawnsPerMapValue, containerContentPerMapValue, allItemMetadataValue]) => {
                translations.value = translationsValue;

                averageSpawnsPerMap.value = mapLootDataToAverageSpawnsPerMap(
                    staticSpawnsPerMapValue,
                    containerContentPerMapValue,
                    translationsValue,
                );

                allItemMetadata.value = allItemMetadataValue;
            })
            .catch((err: unknown) => {
                console.error(err);
            });
    }, []);

    return (
        <div className={'bg-gray-950 min-h-[100vh]'}>
            <TierList />
        </div>
    );
}
