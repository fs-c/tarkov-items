import { Signal } from '@preact/signals';
import { twMerge as tw } from 'tailwind-merge';

export function ItemDetail({ itemId, className }: { itemId: string; className: string }) {
    return (
        <div className={tw(className, 'min-w-96 rounded-xl bg-gray-900 p-4 shadow-2xl')}>
            {itemId}
        </div>
    );
}
