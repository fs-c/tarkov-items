import { useComputed } from '@preact/signals';
import { Location } from '../model/loot-data';
import { allMapMetadata, looseLootPerMap } from '../store/data';
import { useRef } from 'preact/hooks';

import * as L from 'leaflet';

const map = Location.Lighthouse;

function rotatePoint(point: { x: number; y: number }, radians: number) {
    return {
        x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
        y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
    };
}

function mirrorPointAlongLine(point: { x: number; y: number }, line: { x: number; y: number }) {
    const lineLength = Math.sqrt(line.x * line.x + line.y * line.y);
    const normalizedLine = { x: line.x / lineLength, y: line.y / lineLength };

    const dotProduct = point.x * normalizedLine.x + point.y * normalizedLine.y;
    const mirroredPoint = {
        x: 2 * dotProduct * normalizedLine.x - point.x,
        y: 2 * dotProduct * normalizedLine.y - point.y,
    };

    return mirroredPoint;
}

function transformPointFromCenterToTopLeft(
    point: { x: number; y: number },
    dimensions: { width: number; height: number },
) {
    return {
        x: dimensions.width - (point.x + dimensions.width / 2),
        y: point.y + dimensions.height / 2,
    };
}

function applyScaleAndMarginToPoint(
    point: { x: number; y: number },
    scale: { x: number; y: number },
    margin: { x: number; y: number },
) {
    return {
        x: point.x * scale.x + margin.x,
        y: point.y * scale.y + margin.y,
    };
}

export function LootSpawnsMap() {
    const containerRef = useRef<HTMLDivElement>(null);

    const mapMetadata = useComputed(() => {
        const metadata = allMapMetadata.value.get(map);
        if (!metadata) {
            return undefined;
        }

        const data = metadata.maps[0];
        if (data.key !== map.toString()) {
            return undefined;
        }

        return data;
    });

    const mapDimensions = useComputed(() => {
        const rawBounds = mapMetadata.value?.bounds;
        if (!rawBounds) {
            return { width: 0, height: 0 };
        }

        return {
            width: Math.abs(rawBounds[1][0] - rawBounds[0][0]),
            height: Math.abs(rawBounds[1][1] - rawBounds[0][1]),
        };
    });

    const mapCenter = useComputed(() => {
        return {
            x: mapDimensions.value.width / 2,
            y: mapDimensions.value.height / 2,
        };
    });

    const mapTransformationCenter = useComputed(() => {
        const rawBounds = mapMetadata.value?.bounds;
        if (!rawBounds) {
            return { x: 0, y: 0 };
        }

        // this emulates the bounds calculation of leaflet
        const bounds = {
            topLeft: {
                x: Math.min(rawBounds[1][0], rawBounds[0][0]),
                y: Math.min(rawBounds[1][1], rawBounds[0][1]),
            },
            bottomRight: {
                x: Math.max(rawBounds[1][0], rawBounds[0][0]),
                y: Math.max(rawBounds[1][1], rawBounds[0][1]),
            },
        };

        return {
            x: (bounds.topLeft.x + bounds.bottomRight.x) / 2,
            y: (bounds.topLeft.y + bounds.bottomRight.y) / 2,
        };
    });

    const looseLootSpawnpoints = useComputed(() => {
        const looseLoot = looseLootPerMap.value.get(map);
        if (!looseLoot) {
            return [];
        }

        // const rotation = (mapMetadata.value?.coordinateRotation ?? 0 * Math.PI) / 180;
        // const scale = {
        //     x: mapMetadata.value?.transform[0] ?? 1,
        //     y: mapMetadata.value?.transform[2] ?? 1,
        // };
        // const margin = {
        //     x: mapMetadata.value?.transform[1] ?? 0,
        //     y: mapMetadata.value?.transform[3] ?? 0,
        // };

        // positions are given as [x, y, z] where y is the height, since we are (mostly) in a 2d
        // context we rename original z to y and y to height to make it more obvious
        return looseLoot.spawnpoints.map((spawnpoint) => {
            const position = {
                x: spawnpoint.template.Position.x,
                y: spawnpoint.template.Position.z,
            };

            const correctedFromCenter = {
                x: position.x - mapTransformationCenter.value.x,
                y: position.y - mapTransformationCenter.value.y,
            };
            const transformedFromCenter = transformPointFromCenterToTopLeft(
                correctedFromCenter,
                mapDimensions.value,
            );

            return {
                position: transformedFromCenter,
            };
        });
    });

    if (!mapMetadata.value) {
        return <div>loading...</div>;
    }

    return (
        <div class={'flex h-full w-full items-center justify-center'} ref={containerRef}>
            <svg
                style={{
                    width: mapDimensions.value.width,
                    height: mapDimensions.value.height,
                    backgroundColor: 'transparent',
                }}
            >
                <image
                    href={mapMetadata.value.svgPath}
                    width={mapDimensions.value.width}
                    height={mapDimensions.value.height}
                />

                {looseLootSpawnpoints.value.map((spawnpoint, index) => (
                    <circle
                        key={index}
                        cx={spawnpoint.position.x}
                        cy={spawnpoint.position.y}
                        r={2}
                        fill='green'
                    />
                ))}
            </svg>
        </div>
    );
}
