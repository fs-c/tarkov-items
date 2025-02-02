import { Signal, useComputed, useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { allItemMetadata } from '../store/data';
import uFuzzy from '@leeoniya/ufuzzy';
import { MagnifyingGlassIcon } from './lib/MagnifyingGlassIcon';
import { ItemIcon } from './lib/ItemIcon';
import { twMerge as tw } from 'tailwind-merge';
import { MapPinIconOutline, MapPinIconSolid } from './lib/MapPinIcon';

const ufuzzy = new uFuzzy();

export function ItemSearchDialog({
    close,
    $selectedItemIds,
}: {
    close: () => void;
    $selectedItemIds: Signal<string[]>;
}) {
    const searchInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchInput.current) {
            searchInput.current.focus();
        }
    }, []);

    const allItemNamesAndIds = useComputed(() => {
        const allItemNames = [];
        const allItemIds = [];
        for (const item of allItemMetadata.value.values()) {
            // this is terrible but it's a quick fix and it doesn't really matter
            allItemNames.push(`${item.shortName} ${item.name}`);
            allItemIds.push(item.id);
        }
        return [allItemNames, allItemIds];
    });

    const searchString = useSignal('');

    const searchResults = useComputed(() => {
        const [allItemNames, allItemIds] = allItemNamesAndIds.value;
        if (allItemNames == null || allItemIds == null) {
            return [];
        }

        const [ids, _, order] = ufuzzy.search(allItemNames, searchString.value);

        let allItemIndices: number[] = [];
        if (order) {
            allItemIndices = order.map((idx) => ids[idx]).filter((idx) => idx != null);
        } else if (ids) {
            allItemIndices = ids;
        } else {
            allItemIndices = [];
        }

        return allItemIndices
            .map((id) => allItemMetadata.value.get(allItemIds[id]!))
            .filter((item) => item != null)
            .slice(0, 50);
    });

    const currentlyHighlightedIndex = useSignal<number>(0);

    const currentlyHighlightedId = useComputed(() => {
        if (currentlyHighlightedIndex.value == null) {
            return undefined;
        }

        return searchResults.value[currentlyHighlightedIndex.value]?.id;
    });

    const onSelectItem = (idToSelect: string) => {
        if ($selectedItemIds.value.includes(idToSelect)) {
            $selectedItemIds.value = $selectedItemIds.value.filter((id) => id !== idToSelect);
        } else {
            $selectedItemIds.value = [...$selectedItemIds.value, idToSelect];
        }
    };

    const scrollElementIntoView = (id: string | undefined) => {
        if (id == null) {
            return;
        }

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }

            if (event.key === 'ArrowDown') {
                if (currentlyHighlightedIndex.value == null) {
                    currentlyHighlightedIndex.value = 0;
                } else {
                    currentlyHighlightedIndex.value =
                        (currentlyHighlightedIndex.value + 1) % searchResults.value.length;
                }

                scrollElementIntoView(currentlyHighlightedId.value);

                event.preventDefault();
            }

            if (event.key === 'ArrowUp') {
                if (currentlyHighlightedIndex.value == null) {
                    currentlyHighlightedIndex.value = searchResults.value.length - 1;
                } else {
                    currentlyHighlightedIndex.value =
                        (currentlyHighlightedIndex.value - 1 + searchResults.value.length) %
                        searchResults.value.length;
                }

                scrollElementIntoView(currentlyHighlightedId.value);

                event.preventDefault();
            }

            if (event.key === 'Enter') {
                if (currentlyHighlightedId.value == null) {
                    return;
                }

                onSelectItem(currentlyHighlightedId.value);

                if (searchResults.value.length === 1) {
                    close();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const itemsToShow = useComputed(() => {
        if (searchResults.value.length === 0) {
            return $selectedItemIds.value
                .map((id) => allItemMetadata.value.get(id))
                .filter((item) => item != null);
        }

        return searchResults.value;
    });

    return (
        <div
            className={
                'absolute inset-0 z-50 flex h-full w-full flex-col items-center bg-stone-800/50'
            }
            onClick={close}
        >
            <div className={'h-[20%] flex-shrink'} />

            <div
                className={
                    'flex w-96 flex-col overflow-clip rounded-lg bg-stone-600/50 backdrop-blur-sm'
                }
                onClick={(event) => event.stopPropagation()}
            >
                <header className={'flex flex-row items-center gap-4 px-6 py-4'}>
                    <MagnifyingGlassIcon className={'size-6'} />

                    <input
                        className={'w-full bg-transparent text-stone-300 outline-none'}
                        placeholder={'Search for items...'}
                        ref={searchInput}
                        type='text'
                        value={searchString}
                        onChange={(event) => {
                            if (event.target) {
                                searchString.value = (event.target as HTMLInputElement).value;
                            }
                        }}
                    />

                    <button className={'font-semibold text-stone-400'} onClick={close}>
                        Esc
                    </button>
                </header>

                <div
                    className={
                        'flex max-h-96 flex-col gap-2 overflow-y-auto bg-stone-800/50 p-4 backdrop-blur-sm'
                    }
                >
                    {itemsToShow.value.length === 0 && (
                        <div className={'text-stone-400'}>No results</div>
                    )}

                    {itemsToShow.value.map((item, index) => (
                        <button
                            key={item.id}
                            id={item.id}
                            className={tw(
                                'flex flex-row items-center gap-4 rounded-md border border-transparent bg-stone-800/70 p-2 pr-3 aria-selected:border-stone-500',
                            )}
                            onClick={() => onSelectItem(item.id)}
                            aria-selected={index === currentlyHighlightedIndex.value}
                            onMouseEnter={() => {
                                currentlyHighlightedIndex.value = index;
                            }}
                        >
                            <ItemIcon iconLink={item.iconLink} />

                            <p className={'flex-grow text-start'}>{item.shortName}</p>

                            {$selectedItemIds.value.includes(item.id) ? (
                                <MapPinIconSolid className={'size-6 text-stone-400'} />
                            ) : (
                                <MapPinIconOutline className={'size-6 text-stone-400'} />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
