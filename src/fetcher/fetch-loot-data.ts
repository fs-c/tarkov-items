import {
    ContainerContent,
    StaticSpawns,
    Translations,
    Location,
    isStaticSpawnms,
    isContainerContent,
    LooseLoot,
    isLooseLoot,
} from '../model/loot-data';

/**
 * Paths in this file are RELATIVE TO THE CURRENT PAGE (i.e. whatever the current path is when the
 * function is called). This is a quick workaround to make github pages work.
 */

export async function fetchTranslations(): Promise<Translations> {
    const response = await fetch('./database/translations.json');
    const rawTranslations = await (response.json() as Promise<Record<string, string>>);

    const translations = new Map<string, string>();

    for (const [key, value] of Object.entries(rawTranslations)) {
        const [tpl, type] = key.split(' ');

        if (type === 'ShortName') {
            translations.set(tpl, value);
        }
    }

    return translations;
}

export async function fetchStaticSpawnsPerMap(): Promise<Map<Location, StaticSpawns>> {
    const staticSpawnsPerMap = new Map<Location, StaticSpawns>();

    for (const location of Object.values(Location)) {
        const response = await fetch(`./database/${location}/staticContainers.json`);
        const data = await (response.json() as Promise<unknown>);

        if (!isStaticSpawnms(data)) {
            throw new Error(`invalid staticContainers.json for ${location}`);
        }

        staticSpawnsPerMap.set(location, data);
    }

    return staticSpawnsPerMap;
}

export async function fetchContainerContentPerMap(): Promise<Map<Location, ContainerContent>> {
    const containerContentPerMap = new Map<Location, ContainerContent>();

    for (const location of Object.values(Location)) {
        const response = await fetch(`./database/${location}/staticLoot.json`);
        const data = await (response.json() as Promise<unknown>);

        if (!isContainerContent(data)) {
            throw new Error(`invalid staticLoot.json for ${location}`);
        }

        containerContentPerMap.set(location, data);
    }

    return containerContentPerMap;
}

export async function fetchLooseLootPerMap(): Promise<Map<Location, LooseLoot>> {
    const looseLootPerMap = new Map<Location, LooseLoot>();

    for (const location of Object.values(Location)) {
        const response = await fetch(`./database/${location}/looseLoot.json`);
        const data = await (response.json() as Promise<unknown>);

        if (!isLooseLoot(data)) {
            throw new Error(`invalid looseLoot.json for ${location}`);
        }

        looseLootPerMap.set(location, data);
    }

    return looseLootPerMap;
}
