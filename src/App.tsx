import { signal } from '@preact/signals';
import { Location } from './stores/spt-data.store';
import { useEffect } from 'preact/hooks';
import { getItemMetadata, itemMetadata } from './stores/tarkov-dev-data';

export const App = () => {
    const selectedMaps = signal(Object.values(Location));
    const minPricePerSlot = signal(1000);

    useEffect(() => {
        getItemMetadata().then((metadata) => (itemMetadata.value = metadata));
    }, []);

    return <div className={'min-h-screen bg-gray-800'}></div>;
};
