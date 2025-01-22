import { ReadonlySignal } from '@preact/signals';
import { twMerge as tw } from 'tailwind-merge';
import { FrontendLocationWithVariation, FrontendLocationWithVariations } from '../App';

function MapSelectionBarEntry({
    locationWithVariation,
    selectedLocation,
    onChangeLocation,
}: {
    locationWithVariation: FrontendLocationWithVariations;
    selectedLocation: ReadonlySignal<FrontendLocationWithVariation>;
    onChangeLocation: (locationWithVariation: FrontendLocationWithVariation) => void;
}) {
    const [displayLocation, variations, defaultLocation] = locationWithVariation;
    const isSelected = selectedLocation.value[0] === displayLocation;
    return (
        <div
            key={displayLocation}
            className={tw(
                'flex w-max flex-row gap-2 overflow-hidden rounded-lg font-semibold',
                isSelected && 'bg-stone-400/10',
            )}
        >
            <button
                className={tw(
                    'px-4 py-2 text-stone-300',
                    isSelected ? 'bg-stone-300 text-stone-800' : 'hover:bg-stone-300/10',
                )}
                onClick={() => onChangeLocation([displayLocation, defaultLocation])}
            >
                {displayLocation}
            </button>

            {variations.length > 0 && isSelected && (
                <div className={'flex flex-row gap-2 py-2 pl-1 pr-2 text-stone-300'}>
                    {variations.map(([variationName, variationLocation]) => (
                        <button
                            key={variationLocation}
                            onClick={() => onChangeLocation([displayLocation, variationLocation])}
                            className={tw(
                                variationLocation === selectedLocation.value[1]
                                    ? 'underline'
                                    : 'hover:underline',
                            )}
                        >
                            {variationName}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function MapSelectionBar({
    locationsWithVariations,
    selectedLocation,
    onChangeLocation,
}: {
    locationsWithVariations: ReadonlySignal<FrontendLocationWithVariations[]>;
    selectedLocation: ReadonlySignal<FrontendLocationWithVariation>;
    onChangeLocation: (locationWithVariation: FrontendLocationWithVariation) => void;
}) {
    return (
        <div
            className={'flex h-[52px] overflow-x-auto rounded-xl bg-stone-800/50 backdrop-blur-sm'}
        >
            <div className={'flex flex-row gap-2 p-2'}>
                {locationsWithVariations.value.map((locationWithVariation) => (
                    <MapSelectionBarEntry
                        key={locationWithVariation[0]}
                        locationWithVariation={locationWithVariation}
                        selectedLocation={selectedLocation}
                        onChangeLocation={onChangeLocation}
                    />
                ))}
            </div>
        </div>
    );
}
