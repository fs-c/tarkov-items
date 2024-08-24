import { RarityGraph } from './RarityGraph';
import { useSignal } from '@preact/signals';
import { ItemType } from '../model/item-metadata';
import { InputNumber } from './lib/Input';
import { ItemDetail } from './ItemDetail';

export function RarityVisualization() {
    const minimumPricePerSlot = useSignal(10000);
    const itemTypes = useSignal<ItemType[]>(Object.values(ItemType));

    const selectedItemId = useSignal<string | undefined>(undefined);

    return (
        <div className={'flex h-screen w-screen flex-col gap-4 bg-gray-800 p-4'}>
            <div>
                <InputNumber
                    label={'Minimum price per slot'}
                    value={minimumPricePerSlot.value}
                    onChange={(value) => (minimumPricePerSlot.value = value)}
                />
            </div>

            <div class={'relative flex flex-grow'}>
                <div class={'flex-grow overflow-hidden rounded-xl'}>
                    <RarityGraph
                        minimumPricePerSlot={minimumPricePerSlot}
                        itemTypes={itemTypes}
                        selectedItemId={selectedItemId}
                    />
                </div>

                {selectedItemId.value != null && (
                    <ItemDetail className={'absolute right-4 top-4'} itemId={selectedItemId.value} />
                )}
            </div>
        </div>
    );
}
