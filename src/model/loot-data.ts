export enum Location {
    Customs = 'bigmap',
    FactoryDay = 'factory4_day',
    FactoryNight = 'factory4_night',
    Interchange = 'interchange',
    Labs = 'laboratory',
    Lighthouse = 'lighthouse',
    Reserve = 'rezervbase',
    GroundZeroLow = 'sandbox',
    GroundZeroHigh = 'sandbox_high',
    Shoreline = 'shoreline',
    Streets = 'tarkovstreets',
    Woods = 'woods',
}

export type Translations = Map<string, string>;

export interface StaticSpawns {
    staticContainers: {
        probability: number;
        template: {
            Items: [
                {
                    _tpl: string;
                },
            ];
        };
    }[];
    // these are empty most of the time, but it might be interesting to consider
    // them as well
    staticWeapons: unknown[];
    staticForced: unknown[];
}

export type ContainerContent = Record<
    string,
    {
        itemcountDistribution: {
            count: number;
            relativeProbability: number;
        }[];
        itemDistribution: {
            tpl: string;
            relativeProbability: number;
        }[];
    }
>;

export function isStaticSpawnms(data: unknown): data is StaticSpawns {
    return (
        typeof data === 'object' &&
        data != null &&
        'staticContainers' in data &&
        Array.isArray(data.staticContainers)
    );
}

export function isContainerContent(data: unknown): data is ContainerContent {
    return typeof data === 'object' && data != null;
}
