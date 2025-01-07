import { RarityGraph } from './RarityGraph';
import { Signal, useComputed, useSignal } from '@preact/signals';
import { ItemType } from '../model/item-metadata';
import { InputNumber } from './lib/Input';
import { ItemDetail } from './ItemDetail';
import { Location } from '../model/loot-data';
import { averageContainersPerMap } from '../store/computed/spawns-per-map';

function CheckboxGroup({
    label,
    allPossibleItems,
    selectedItems,
}: {
    label: string;
    allPossibleItems: string[];
    selectedItems: Signal<string[]>;
}) {
    const shouldSelectAll = useComputed(
        () => selectedItems.value.length !== allPossibleItems.length,
    );

    const onSelectAllButtonClick = () => {
        if (shouldSelectAll.value) {
            selectedItems.value = allPossibleItems;
        } else {
            selectedItems.value = [];
        }
    };

    const onItemCheckboxChange = (item: string) => {
        if (selectedItems.value.includes(item)) {
            selectedItems.value = selectedItems.value.filter((i) => i !== item);
        } else {
            selectedItems.value = [...selectedItems.value, item];
        }
    };

    return (
        <div className={'flex flex-col gap-2'}>
            <h3 className={'font-bold'}>
                {label}
                <button
                    className={'pl-4 text-sm font-normal text-gray-400 underline'}
                    onClick={onSelectAllButtonClick}
                >
                    {shouldSelectAll.value ? 'Select all' : 'Deselect all'}
                </button>
            </h3>

            <div className={'flex flex-row flex-wrap gap-2'}>
                {allPossibleItems.map((item) => (
                    <div className={'flex flex-row items-center gap-1'}>
                        <input
                            id={'checkbox-' + item}
                            type={'checkbox'}
                            checked={selectedItems.value.includes(item)}
                            onChange={() => {
                                onItemCheckboxChange(item);
                            }}
                        />
                        <label for={'checkbox-' + item}>{item}</label>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function RarityVisualization() {
    const allMaps = Object.values(Location);
    const allItemTypes = Object.values(ItemType);

    const minimumPricePerSlot = useSignal(10000);

    const maps = useSignal<Location[]>(allMaps);
    const itemTypes = useSignal<ItemType[]>(allItemTypes);

    const possibleContainers = useComputed(() =>
        maps.value.flatMap((map) =>
            Array.from(averageContainersPerMap.value.get(map)?.keys() ?? []),
        ),
    );
    const containers = useSignal<string[]>(possibleContainers.value);

    const selectedItemId = useSignal<string | undefined>(undefined);

    return (
        <div className={'flex h-screen w-screen flex-col gap-4 bg-gray-800 p-4'}>
            <div className={'w-fit'}>
                <InputNumber
                    label={'Minimum price per slot'}
                    value={minimumPricePerSlot.value}
                    onChange={(value) => (minimumPricePerSlot.value = value)}
                />
            </div>

            <CheckboxGroup label={'Maps'} allPossibleItems={allMaps} selectedItems={maps} />

            <CheckboxGroup
                label={'Item Types'}
                allPossibleItems={allItemTypes}
                selectedItems={itemTypes}
            />

            {/* <CheckboxGroup label={'Containers'} allPossibleItems={possibleContainers.value} selectedItems={containers} /> */}

            <div class={'relative flex flex-grow'}>
                <div class={'flex-grow overflow-hidden rounded-xl'}>
                    <RarityGraph
                        minimumPricePerSlot={minimumPricePerSlot}
                        itemTypes={itemTypes}
                        maps={maps}
                        containers={possibleContainers}
                        selectedItemId={selectedItemId}
                    />
                </div>

                {selectedItemId.value != null && (
                    <ItemDetail
                        className={'absolute right-4 top-4'}
                        itemId={selectedItemId.value}
                    />
                )}
            </div>
        </div>
    );
}
