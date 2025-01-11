import { useComputed } from '@preact/signals';
import { Location } from '../model/loot-data';
import { allMapMetadata, looseLootPerMap } from '../store/data';
import { useRef } from 'preact/hooks';

const map = Location.Lighthouse;

export function LootSpawnsMap() {
    const svgRef = useRef<SVGSVGElement>(null);

    const mapMetadata = useComputed(() => {
        const metadata = allMapMetadata.value.get(map);
        if (!metadata) {
            throw new Error(`map metadata not found for map ${map}`);
        }

        const data = metadata.maps[0];
        if (data.key !== map.toString()) {
            throw new Error(`map metadata not found for map ${map}`);
        }

        return data;
    });

    const looseLootSpawnpoints = useComputed(() => {
        const looseLoot = looseLootPerMap.value.get(map);
        if (!looseLoot) {
            throw new Error(`loose loot not found for map ${map}`);
        }

        // positions are given as [x, y, z] where y is the height, since we are (mostly) in a 2d
        // context we rename original z to y and y to height to make it more obvious
        return looseLoot.spawnpoints.map((spawnpoint) => ({
            position: {
                x: spawnpoint.template.Position.x,
                y: spawnpoint.template.Position.z,
                height: spawnpoint.template.Position.y,
            },
        }));
    });

    return (
        <>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${mapMetadata.value.bounds[1][0] - mapMetadata.value.bounds[0][0]} ${
                    mapMetadata.value.bounds[1][1] - mapMetadata.value.bounds[0][1]
                }`}
                style={{
                    width: '100%',
                    height: 'auto',
                    backgroundColor: 'black',
                }}
            >
                <g
                    transform={`translate(${mapMetadata.value.bounds[0][0]}, ${mapMetadata.value.bounds[0][1]})`}
                >
                    <image
                        href={mapMetadata.value.svgPath}
                        width={mapMetadata.value.bounds[1][0] - mapMetadata.value.bounds[0][0]}
                        height={mapMetadata.value.bounds[1][1] - mapMetadata.value.bounds[0][1]}
                    />
                    {looseLootSpawnpoints.value.map((spawnpoint, index) => (
                        <circle
                            key={index}
                            cx={spawnpoint.position.x}
                            cy={spawnpoint.position.y}
                            r={2}
                            fill='red'
                        />
                    ))}
                </g>
            </svg>
        </>
    );
}
