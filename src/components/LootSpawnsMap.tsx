import { useComputed, useSignalEffect } from '@preact/signals';
import { Location } from '../model/loot-data';
import { allMapMetadata, looseLootPerMap } from '../store/data';
import { useRef } from 'preact/hooks';
import { useResizeObserver } from '../util/use-resize-observer';
import { LoadingSpinner } from './lib/LoadingSpinner';
import { Dimensions, Point } from '../util/common';

const map = Location.Lighthouse;

// function rotatePoint(point: { x: number; y: number }, radians: number) {
//     return {
//         x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
//         y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
//     };
// }

// function mirrorPointAlongLine(point: { x: number; y: number }, line: { x: number; y: number }) {
//     const lineLength = Math.sqrt(line.x * line.x + line.y * line.y);
//     const normalizedLine = { x: line.x / lineLength, y: line.y / lineLength };

//     const dotProduct = point.x * normalizedLine.x + point.y * normalizedLine.y;
//     const mirroredPoint = {
//         x: 2 * dotProduct * normalizedLine.x - point.x,
//         y: 2 * dotProduct * normalizedLine.y - point.y,
//     };

//     return mirroredPoint;
// }

// function applyScaleAndMarginToPoint(
//     point: { x: number; y: number },
//     scale: { x: number; y: number },
//     margin: { x: number; y: number },
// ) {
//     return {
//         x: point.x * scale.x + margin.x,
//         y: point.y * scale.y + margin.y,
//     };
// }

// function transformPointFromCenterToTopLeft(point: Point, dimensions: Dimensions): Point {
//     return {
//         x: dimensions.width - (point.x + dimensions.width / 2),
//         y: point.y + dimensions.height / 2,
//     };
// }

function transformMapPointToSvgPoint(
    mapPoint: Point,
    positionedMapDimensions: {
        topLeft: Point;
        bottomRight: Point;
    },
    naturalMapDimensions: Dimensions,
): Point {
    // center of the line between topLeft and bottomRight
    const { topLeft, bottomRight } = positionedMapDimensions;
    const centerOfBounds = {
        x: (topLeft.x + bottomRight.x) / 2,
        y: (topLeft.y + bottomRight.y) / 2,
    };

    const alignedMapPoint = {
        x: mapPoint.x - centerOfBounds.x,
        y: mapPoint.y - centerOfBounds.y,
    };

    const svgPoint = {
        x: naturalMapDimensions.width - (alignedMapPoint.x + naturalMapDimensions.width / 2),
        y: alignedMapPoint.y + naturalMapDimensions.height / 2,
    };

    return svgPoint;
}

export function LootSpawnsMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerDimensions = useResizeObserver(containerRef);

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

    const mapBoundingPoints = useComputed(() => {
        const rawBounds = mapMetadata.value?.bounds;
        if (!rawBounds) {
            return undefined;
        }

        // this emulates the bounds calculation of leaflet
        return {
            topLeft: {
                x: Math.min(rawBounds[1][0], rawBounds[0][0]),
                y: Math.min(rawBounds[1][1], rawBounds[0][1]),
            },
            bottomRight: {
                x: Math.max(rawBounds[1][0], rawBounds[0][0]),
                y: Math.max(rawBounds[1][1], rawBounds[0][1]),
            },
        };
    });

    const naturalMapDimensions = useComputed(() => {
        if (!mapBoundingPoints.value) {
            return { width: 0, height: 0 };
        }

        const topLeft = mapBoundingPoints.value.topLeft;
        const bottomRight = mapBoundingPoints.value.bottomRight;

        return {
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y,
        };
    });

    const fittedNaturalMapDimensions = useComputed(() => {
        // do an object-fit inside the container width/height
        const containerAspectRatio =
            containerDimensions.value.width / containerDimensions.value.height;
        const naturalMapAspectRatio =
            naturalMapDimensions.value.width / naturalMapDimensions.value.height;

        if (containerAspectRatio > naturalMapAspectRatio) {
            return {
                width: containerDimensions.value.height * naturalMapAspectRatio,
                height: containerDimensions.value.height,
            };
        } else {
            return {
                width: containerDimensions.value.width,
                height: containerDimensions.value.width / naturalMapAspectRatio,
            };
        }
    });

    const mapTransformationCenter = useComputed(() => {
        if (!mapBoundingPoints.value) {
            return { x: 0, y: 0 };
        }

        // this emulates the center calculation of leaflet
        return {
            x: (mapBoundingPoints.value.topLeft.x + mapBoundingPoints.value.bottomRight.x) / 2,
            y: (mapBoundingPoints.value.topLeft.y + mapBoundingPoints.value.bottomRight.y) / 2,
        };
    });

    const looseLootSpawnpoints = useComputed(() => {
        const looseLoot = looseLootPerMap.value.get(map);
        if (!looseLoot) {
            return [];
        }

        if (!mapBoundingPoints.value) {
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

            // const correctedFromCenter = {
            //     x: position.x - mapTransformationCenter.value.x,
            //     y: position.y - mapTransformationCenter.value.y,
            // };
            // const transformedFromCenter = transformPointFromCenterToTopLeft(
            //     correctedFromCenter,
            //     naturalMapBounds.value,
            // );

            return {
                position: transformMapPointToSvgPoint(
                    position,
                    mapBoundingPoints.value,
                    naturalMapDimensions.value,
                    fittedNaturalMapDimensions.value,
                ),
            };
        });
    });

    return (
        <div class={'flex h-full w-full items-center justify-center'} ref={containerRef}>
            {mapMetadata.value == null || looseLootSpawnpoints.value.length === 0 ? (
                <LoadingSpinner />
            ) : (
                <>
                    <svg
                        width={fittedNaturalMapDimensions.value.width}
                        height={fittedNaturalMapDimensions.value.height}
                    >
                        <image
                            href={mapMetadata.value.svgPath}
                            width={fittedNaturalMapDimensions.value.width}
                            height={fittedNaturalMapDimensions.value.height}
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
                </>
            )}
        </div>
    );
}
