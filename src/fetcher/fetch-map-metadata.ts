import { DisplayLocation } from '../model/location';
import { MapMetadataCollection } from '../model/map-metadata';

function getDisplayLocationForMapMetadata(
    mapMetadata: MapMetadataCollection,
): DisplayLocation | undefined {
    switch (mapMetadata.normalizedName) {
        case 'lighthouse':
            return DisplayLocation.Lighthouse;
        case 'shoreline':
            return DisplayLocation.Shoreline;
        case 'interchange':
            return DisplayLocation.Interchange;
        case 'reserve':
            return DisplayLocation.Reserve;
        case 'woods':
            return DisplayLocation.Woods;
        case 'customs':
            return DisplayLocation.Customs;
        case 'factory':
            return DisplayLocation.Factory;
        case 'the-lab':
            return DisplayLocation.Labs;
        case 'streets-of-tarkov':
            return DisplayLocation.Streets;
        case 'ground-zero':
            return DisplayLocation.GroundZero;
        default:
            return undefined;
    }
}

export function fetchAllMapMetadata(): Promise<Map<DisplayLocation, MapMetadataCollection>> {
    // todo: this isn't even remotely trying to be type safe
    const data = fetch('./database/map-metadata.json').then((response) =>
        response.json(),
    ) as Promise<MapMetadataCollection[]>;

    return data.then((rawMapMetadata) => {
        const mapMetadata = new Map<DisplayLocation, MapMetadataCollection>();

        for (const map of rawMapMetadata) {
            const location = getDisplayLocationForMapMetadata(map);
            if (location) {
                mapMetadata.set(location, map);
            } else {
                console.warn(`skipping unknown map ${map.normalizedName}`);
            }
        }

        return mapMetadata;
    });
}
