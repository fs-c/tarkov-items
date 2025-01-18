import { LooseLoot, LooseLootItem, LooseLootSpawnpoint } from '../model/loose-loot';
import { normalizeProbabilities } from '../util/display';
import { Location } from '../model/location';

// this ignores
//   - spawnpointCount, because i don't know how to interpret it
//   - spawnpointsForced, because i don't think it's relevant (only quest items?)
interface RawLooseLoot {
    spawnpoints: {
        probability: number;
        template: RawLooseLootSpawnpointTemplate;
        itemDistribution: {
            composedKey: {
                key: string; // this references the item _id
            };
            relativeProbability: number;
        }[];
    }[];
}

interface RawLooseLootSpawnpointTemplate {
    Id: string;
    Position: {
        x: number;
        y: number;
        z: number;
    };
    Items: {
        _id: string;
        _tpl: string;
        parentId: string;
        slotId: string;
    }[];
}

function mapRawLooseLootToLooseLoot(data: RawLooseLoot): LooseLoot {
    const spawnpoints: LooseLootSpawnpoint[] = [];

    for (const spawnpoint of data.spawnpoints) {
        const normalizedDistribution = normalizeProbabilities(spawnpoint.itemDistribution);

        const items: LooseLootItem[] = [];
        for (const item of normalizedDistribution) {
            const itemTpl = spawnpoint.template.Items.find(
                (i) => i._id === item.composedKey.key,
            )?._tpl;

            if (!itemTpl) {
                console.warn(
                    `item ${item.composedKey.key} not found in spawnpoint template ${spawnpoint.template.Id}`,
                );
                continue;
            }

            items.push({
                tpl: itemTpl,
                probability: item.probability * spawnpoint.probability,
            });
        }

        spawnpoints.push({
            position: {
                x: spawnpoint.template.Position.x,
                y: spawnpoint.template.Position.z,
                height: spawnpoint.template.Position.y,
            },
            items,
            probability: spawnpoint.probability,
        });
    }

    return { spawnpoints };
}

export async function fetchLooseLootPerMap(): Promise<Map<Location, LooseLoot>> {
    const looseLootPerMap = new Map<Location, LooseLoot>();

    for (const location of Object.values(Location)) {
        const response = await fetch(`./database/${location}/looseLoot.json`);
        const data = await (response.json() as Promise<RawLooseLoot>);

        looseLootPerMap.set(location, mapRawLooseLootToLooseLoot(data));
    }

    return looseLootPerMap;
}
