import { Location } from '../model/location';
import { ContainerContent, StaticSpawns } from '../model/container-data';

/**
 * Paths in this file are RELATIVE TO THE CURRENT PAGE (i.e. whatever the current path is when the
 * function is called). This is a quick workaround to make github pages work.
 */

export async function fetchStaticSpawnsPerMap(): Promise<Map<Location, StaticSpawns>> {
    const staticSpawnsPerMap = new Map<Location, StaticSpawns>();

    for (const location of Object.values(Location)) {
        const response = await fetch(`./database/${location}/staticContainers.json`);
        const data = await (response.json() as Promise<StaticSpawns>);

        staticSpawnsPerMap.set(location, data);
    }

    return staticSpawnsPerMap;
}

export async function fetchContainerContentPerMap(): Promise<Map<Location, ContainerContent>> {
    const containerContentPerMap = new Map<Location, ContainerContent>();

    for (const location of Object.values(Location)) {
        const response = await fetch(`./database/${location}/staticLoot.json`);
        const data = await (response.json() as Promise<ContainerContent>);

        containerContentPerMap.set(location, data);
    }

    return containerContentPerMap;
}
