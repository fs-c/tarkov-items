import { Location } from '../model/location';
import { MapMetadataCollection } from '../model/map-metadata';

function getLocationForMapMetadata(mapMetadata: MapMetadataCollection): Location | undefined {
    switch (mapMetadata.normalizedName) {
        case 'lighthouse':
            return Location.Lighthouse;
        case 'shoreline':
            return Location.Shoreline;
        case 'interchange':
            return Location.Interchange;
        case 'reserve':
            return Location.Reserve;
        case 'woods':
            return Location.Woods;
        case 'customs':
            return Location.Customs;
        case 'factory':
            return Location.FactoryDay;
        case 'the-lab':
            return Location.Labs;
        case 'streets-of-tarkov':
            return Location.Streets;
        case 'ground-zero':
            return Location.GroundZeroHigh;
        default:
            return undefined;
    }
}

export function fetchAllMapMetadata(): Promise<Map<Location, MapMetadataCollection>> {
    // todo: this isn't even remotely trying to be type safe
    const data = fetch('./database/map-metadata.json').then((response) =>
        response.json(),
    ) as Promise<MapMetadataCollection[]>;

    return data.then((rawMapMetadata) => {
        const mapMetadata = new Map<Location, MapMetadataCollection>();

        for (const map of rawMapMetadata) {
            const location = getLocationForMapMetadata(map);
            if (location) {
                mapMetadata.set(location, map);
            } else {
                console.warn(`skipping unknown map ${map.normalizedName}`);
            }
        }

        return mapMetadata;
    });
}
