import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { allMapMetadata, looseLootPerMap } from '../store/data';
import { useRef } from 'preact/hooks';
import { useResizeObserver } from '../util/use-resize-observer';
import { LoadingSpinner } from './lib/LoadingSpinner';
import { Dimensions, Point } from '../model/common';
import { throttle } from '../util/throttle';
import { Location } from '../model/location';
import { useZoomAndPan } from '../util/use-zoom-and-pan';

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

function transformMapPointToSvgPoint(
    mapPoint: Point,
    positionedMapDimensions: {
        topLeft: Point;
        bottomRight: Point;
    },
    naturalMapDimensions: Dimensions,
    svgDimensions: Dimensions,
): Point {
    // center of the line between topLeft and bottomRight
    const { topLeft, bottomRight } = positionedMapDimensions;
    const centerOfBounds = {
        x: (topLeft.x + bottomRight.x) / 2,
        y: (topLeft.y + bottomRight.y) / 2,
    };

    // the center of the positioned bounds is not the absolute center of the bounds
    // (when viewing it just as a rectangle without pos), so we align map points
    // to make them match up
    const alignedMapPoint = {
        x: mapPoint.x - centerOfBounds.x,
        y: mapPoint.y - centerOfBounds.y,
    };

    // this converts points from relative-to-center to relative-to-top-left
    // and also (!!!) mirrors the x-axis, this will likely break with other maps
    const topLeftMapPoint = {
        x: naturalMapDimensions.width - (alignedMapPoint.x + naturalMapDimensions.width / 2),
        y: alignedMapPoint.y + naturalMapDimensions.height / 2,
    };

    // because our svg element is likely not exactly the same size as the natural map size,
    // we do some scaling here
    const svgPoint = {
        x: (topLeftMapPoint.x / naturalMapDimensions.width) * svgDimensions.width,
        y: (topLeftMapPoint.y / naturalMapDimensions.height) * svgDimensions.height,
    };

    return svgPoint;
}

export function LootSpawnsMap({ map }: { map: ReadonlySignal<Location> }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerDimensions = useResizeObserver(containerRef);

    const mapMetadata = useComputed(() => {
        const metadata = allMapMetadata.value.get(map.value);
        console.log(metadata);
        if (!metadata) {
            return undefined;
        }

        // we are assuming that we always want to get the first map, this might be an issue
        return metadata.maps[0];
    });

    const mapBoundingPoints = useComputed(() => {
        const rawBounds = mapMetadata.value?.bounds;
        console.log(rawBounds);
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
            return undefined;
        }

        const topLeft = mapBoundingPoints.value.topLeft;
        const bottomRight = mapBoundingPoints.value.bottomRight;

        return {
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y,
        };
    });

    const fittedNaturalMapDimensions = useComputed(() => {
        if (!containerDimensions.value || !naturalMapDimensions.value) {
            return undefined;
        }

        // do an object-fit inside the container width/height
        const containerAspectRatio =
            containerDimensions.value.width / containerDimensions.value.height;
        const naturalMapAspectRatio =
            naturalMapDimensions.value.width / naturalMapDimensions.value.height;

        console.log(containerDimensions.value.height, naturalMapDimensions.value.height);

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

    const looseLootSpawnpoints = useComputed(() => {
        const looseLoot = looseLootPerMap.value.get(map.value);
        if (!looseLoot) {
            return [];
        }

        const mapBoundingPointsValue = mapBoundingPoints.value;
        const naturalMapDimensionsValue = naturalMapDimensions.value;
        const fittedNaturalMapDimensionsValue = fittedNaturalMapDimensions.value;

        if (
            !mapBoundingPointsValue ||
            !naturalMapDimensionsValue ||
            !fittedNaturalMapDimensionsValue
        ) {
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

            return {
                position: transformMapPointToSvgPoint(
                    position,
                    mapBoundingPointsValue,
                    naturalMapDimensionsValue,
                    fittedNaturalMapDimensionsValue,
                ),
            };
        });
    });

    useSignalEffect(() => {
        console.log(containerDimensions.value);
        console.log(fittedNaturalMapDimensions.value);
    });

    const { viewBoxString } = useZoomAndPan(
        containerRef,
        containerDimensions,
        fittedNaturalMapDimensions,
    );

    return (
        <div class={'flex h-full w-full items-center justify-center'} ref={containerRef}>
            {!mapMetadata.value ||
            looseLootSpawnpoints.value.length === 0 ||
            !containerDimensions.value ||
            !fittedNaturalMapDimensions.value ? (
                <LoadingSpinner />
            ) : (
                <svg
                    width={containerDimensions.value.width}
                    height={containerDimensions.value.height}
                    viewBox={viewBoxString}
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
            )}
        </div>
    );
}
