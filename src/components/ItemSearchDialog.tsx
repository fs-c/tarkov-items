import { useComputed, useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { allItemMetadata } from '../store/data';
import uFuzzy from '@leeoniya/ufuzzy';
import { MagnifyingGlass } from './lib/MagnifyingGlass';
import { ItemIcon } from './lib/ItemIcon';

const ufuzzy = new uFuzzy();

export function ItemSearchDialog({ close }: { close: () => void }) {
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
            allItemNames.push(item.shortName);
            allItemIds.push(item.id);
        }
        return [allItemNames, allItemIds];
    });

    const searchString = useSignal('');

    const searchResults = useComputed(() => {
        const [allItemNames, allItemIds] = allItemNamesAndIds.value;

        const [ids, _, order] = ufuzzy.search(allItemNames, searchString.value);

        let allItemIndices: number[] = [];
        if (order) {
            allItemIndices = order.map((idx) => ids[idx]);
        } else if (ids) {
            allItemIndices = ids;
        } else {
            allItemIndices = [];
        }

        return allItemIndices
            .map((id) => allItemMetadata.value.get(allItemIds[id]))
            .filter((item) => item != null)
            .slice(0, 50);
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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
                <header className={'flex flex-row items-center gap-4 p-4'}>
                    <MagnifyingGlass className={'size-6'} />

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
                    {searchResults.value.length === 0 && (
                        <div className={'text-stone-400'}>No results</div>
                    )}

                    {searchResults.value.map((item) => (
                        <div
                            className={
                                'flex flex-row items-center gap-2 rounded-md bg-stone-900/70 p-2'
                            }
                        >
                            <ItemIcon iconLink={item.iconLink} />

                            <span>{item.shortName}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
