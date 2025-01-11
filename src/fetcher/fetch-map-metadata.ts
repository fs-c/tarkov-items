import { Location } from '../model/loot-data';
import { MapMetadata } from '../model/map-metadata';

export function fetchAllMapMetadata(): Promise<Map<Location, MapMetadata>> {
    // todo: this isn't even remotely trying to be type safe
    const data = fetch('./database/map-metadata.json').then((response) =>
        response.json(),
    ) as Promise<MapMetadata[]>;

    return data.then((rawMapMetadata) => {
        const mapMetadata = new Map<Location, MapMetadata>();

        for (const map of rawMapMetadata) {
            // todo: this is a bit of a hack, i am sure there is a nicer way to do this
            if (!Object.values(Location).includes(map.normalizedName as Location)) {
                throw new Error(`unknown map name: ${map.normalizedName}`);
            }

            mapMetadata.set(map.normalizedName as Location, map);
        }

        return mapMetadata;
    });
}
