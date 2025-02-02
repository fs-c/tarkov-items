import { useEffect, useMemo } from 'preact/hooks';
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
import { signal, useComputed, useSignal } from '@preact/signals';
import { DisplayLocation, Location } from './model/location';
import { fetchTranslations } from './fetcher/fetch-translations';
import { fetchLooseLootPerMap } from './fetcher/fetch-loose-loot';
import { LooseLootSpawnpoint } from './model/loose-loot';
import { formatProbability } from './util/display';
import { MagnifyingGlassIcon } from './components/lib/MagnifyingGlassIcon';
import { ItemSearchDialog } from './components/ItemSearchDialog';
import { createPortal } from 'preact/compat';
import { ItemIcon } from './components/lib/ItemIcon';
import { MapPinIconOutline, MapPinIconSolid } from './components/lib/MapPinIcon';
import { MapSelectionBar } from './components/MapSelectionBar';

// definition of done todos
// todo: investigate potentially incorrect spawnpoints (bug: not a single cofdm spawnpoint on labs can't be true)
// todo: improve pinned item ui (indicate no. of spawnpoints, maybe cumulative probability, maybe allow cycling through spawnpoints?)
// todo: disable maps that just completely don't work
// todo: add attribution (tarkov.dev & spt for data, and dynamic from map metadata) and github link
// todo: investigate performance issues/limit the amount of shown spawnpoints (7k pos calculations is apparently too much, maybe offload to worker?)
// todo: filter out event items

// nice to have todos
// todo: optimize loading times (maybe we can precompute some stuff, or move things into a worker)
// todo: add proper mobile support (ui & zoom/drag)
// todo: add support for layers
// todo: add support for tile paths (for labs)
// todo: improve search dialog responsiveness

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

// these types suck, but it is what it is for the time being
export type FrontendLocationWithVariation = [DisplayLocation, Location];
export type FrontendLocationWithVariations = [DisplayLocation, [string, Location][], Location];

// [displayLocation, [...variations], defaultLocation]
const locationsWithVariations = signal<FrontendLocationWithVariations[]>([
    [DisplayLocation.Lighthouse, [], Location.Lighthouse],
    [DisplayLocation.Customs, [], Location.Customs],
    [
        DisplayLocation.Factory,
        [
            ['Day', Location.FactoryDay],
            ['Night', Location.FactoryNight],
        ],
        Location.FactoryDay,
    ],
    [DisplayLocation.Interchange, [], Location.Interchange],
    [DisplayLocation.Labs, [], Location.Labs],
    [DisplayLocation.Reserve, [], Location.Reserve],
    [
        DisplayLocation.GroundZero,
        [
            ['Low', Location.GroundZeroLow],
            ['High', Location.GroundZeroHigh],
        ],
        Location.GroundZeroLow,
    ],
    [DisplayLocation.Shoreline, [], Location.Shoreline],
    [DisplayLocation.Streets, [], Location.Streets],
    [DisplayLocation.Woods, [], Location.Woods],
]);

export function App() {
    useFetchAllData();

    const selectedLocation = useSignal<FrontendLocationWithVariation>([
        DisplayLocation.Lighthouse,
        Location.Lighthouse,
    ]);

    const selectedSpawnpoint = useSignal<LooseLootSpawnpoint | undefined>(undefined);

    const mapMetadata = useComputed(() => {
        const metadata = allMapMetadata.value.get(selectedLocation.value[0]);
        if (!metadata) {
            return undefined;
        }

        // we are assuming that we always want to get the first map, this might be an issue
        return metadata.maps[0];
    });

    const mapSpawnpoints = useComputed(() => {
        const looseLoot = looseLootPerMap.value.get(selectedLocation.value[1]);
        if (!looseLoot) {
            return [];
        }

        return looseLoot.spawnpoints;
    });

    const selectedItemIds = useSignal<string[]>([]);

    const isSearchDialogOpen = useSignal(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // ctrl+k is used by browsers as well so this is a bad practice, but it's very common so people expect it
            if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
                isSearchDialogOpen.value = !isSearchDialogOpen.value;
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const onChangeLocation = (locationWithVariation: FrontendLocationWithVariation) => {
        selectedLocation.value = [...locationWithVariation];
        selectedSpawnpoint.value = undefined;
    };

    return (
        <div className={'relative h-screen w-screen bg-stone-900'}>
            <div
                className={
                    'absolute top-4 z-10 flex w-full select-none flex-row justify-between gap-4 px-4 text-sm'
                }
            >
                <MapSelectionBar
                    locationsWithVariations={locationsWithVariations}
                    selectedLocation={selectedLocation}
                    onChangeLocation={onChangeLocation}
                />

                <div className={'flex flex-col gap-4'}>
                    <button
                        className={
                            'h-[52px] w-max rounded-xl p-2 backdrop-blur-sm md:bg-stone-800/50'
                        }
                        onClick={() => (isSearchDialogOpen.value = true)}
                    >
                        <div
                            className={
                                'flex h-full w-max flex-row items-center gap-3 rounded-xl pl-2 pr-3 md:hover:bg-stone-300/10'
                            }
                        >
                            <MagnifyingGlassIcon className={'size-5'} />

                            <p className={'hidden w-max font-semibold text-stone-300 md:block'}>
                                Search items...
                            </p>

                            <p className={'hidden w-max text-stone-300 md:block'}>
                                <span className={'monospace'}>Ctrl K</span>
                            </p>
                        </div>
                    </button>

                    <div className={'flex flex-col items-end gap-2'}>
                        {selectedItemIds.value.map((id) => (
                            <button
                                className={
                                    'group flex flex-row items-center gap-2 rounded-md bg-stone-800/50 p-2 backdrop-blur-sm'
                                }
                                onClick={() =>
                                    (selectedItemIds.value = selectedItemIds.value.filter(
                                        (itemId) => itemId !== id,
                                    ))
                                }
                            >
                                <ItemIcon iconLink={allItemMetadata.value.get(id)?.iconLink} />

                                <p className={'text-stone-300'}>{translations.value.get(id)}</p>

                                <MapPinIconSolid
                                    className={'block size-6 text-stone-400 group-hover:hidden'}
                                />

                                <MapPinIconOutline
                                    className={'hidden size-6 text-stone-400 group-hover:block'}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isSearchDialogOpen.value &&
                createPortal(
                    <ItemSearchDialog
                        close={() => (isSearchDialogOpen.value = false)}
                        $selectedItemIds={selectedItemIds}
                    />,
                    document.body,
                )}

            <LootSpawnsMap
                mapMetadata={mapMetadata}
                spawnpoints={mapSpawnpoints}
                $selectedSpawnpoint={selectedSpawnpoint}
                selectedItemIds={selectedItemIds}
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
                                    <ItemIcon
                                        iconLink={allItemMetadata.value.get(item.tpl)?.iconLink}
                                    />

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
