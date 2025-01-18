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
