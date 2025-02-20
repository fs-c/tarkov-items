import { ReadonlySignal, Signal, useComputed } from '@preact/signals';
import { allItemMetadata } from '../store/data';
import { useRef } from 'preact/hooks';
import { useResizeObserver } from '../util/use-resize-observer';
import { LoadingSpinner } from './lib/LoadingSpinner';
import { Dimensions, Point } from '../model/common';
import { useZoomAndPan } from '../util/use-zoom-and-pan';
import { LooseLootItem, LooseLootSpawnpoint } from '../model/loose-loot';
import { MapMetadata } from '../model/map-metadata';
import { twMerge as tw } from 'tailwind-merge';

interface FrontendLooseLootSpawnpoint extends LooseLootSpawnpoint {
    items: (LooseLootItem & {
        icon: string;
    })[];
    highlighted: boolean;
    svgPosition: Point;
}

function rotatePoint(point: { x: number; y: number }, radians: number) {
    return {
        x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
        y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
    };
}

function transformMapPointToSvgPoint(
    mapPoint: Point,
    mapRotation: number,
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

    // the map svg has a different rotation than the game coordinates
    const rotatedPoint = rotatePoint(alignedMapPoint, mapRotation);

    // this converts points from relative-to-center to relative-to-top-left
    const topLeftMapPoint = {
        x: rotatedPoint.x + naturalMapDimensions.width / 2,
        y: -rotatedPoint.y + naturalMapDimensions.height / 2,
    };

    // because our svg element is likely not exactly the same size as the natural map size,
    // we do some scaling here
    const svgPoint = {
        x: (topLeftMapPoint.x / naturalMapDimensions.width) * svgDimensions.width,
        y: (topLeftMapPoint.y / naturalMapDimensions.height) * svgDimensions.height,
    };

    return svgPoint;
}

export function LootSpawnsMap({
    mapMetadata,
    spawnpoints,
    $selectedSpawnpoint,
    selectedItemIds,
}: {
    mapMetadata: ReadonlySignal<MapMetadata | undefined>;
    spawnpoints: ReadonlySignal<LooseLootSpawnpoint[]>;
    $selectedSpawnpoint: Signal<LooseLootSpawnpoint | undefined>;
    selectedItemIds: ReadonlySignal<string[]>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerDimensions = useResizeObserver(containerRef);

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

    const spawnpointsWithPosition = useComputed<FrontendLooseLootSpawnpoint[]>(() => {
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

        const rotationRadians = ((mapMetadata.value?.coordinateRotation ?? 0) * Math.PI) / 180;

        // positions are given as [x, y, z] where y is the height, since we are (mostly) in a 2d
        // context we rename original z to y and y to height to make it more obvious
        return spawnpoints.value.map((spawnpoint) => {
            const position = {
                x: spawnpoint.position.x,
                y: spawnpoint.position.y,
            };

            return {
                ...spawnpoint,
                highlighted: spawnpoint.items.some((item) =>
                    selectedItemIds.value.includes(item.tpl),
                ),
                items: spawnpoint.items.map((item) => ({
                    ...item,
                    icon: allItemMetadata.value.get(item.tpl)?.iconLink ?? '',
                })),
                svgPosition: transformMapPointToSvgPoint(
                    position,
                    rotationRadians,
                    mapBoundingPointsValue,
                    naturalMapDimensionsValue,
                    fittedNaturalMapDimensionsValue,
                ),
            };
        });
    });

    const { viewBoxString, viewBoxScale, isPanning, listeners } = useZoomAndPan(
        containerDimensions,
        fittedNaturalMapDimensions,
    );

    const onSpawnpointClick = (event: MouseEvent, spawnpoint: FrontendLooseLootSpawnpoint) => {
        event.stopPropagation();
        $selectedSpawnpoint.value = spawnpoint;
    };

    return (
        <div class={'flex h-full w-full items-center justify-center'} ref={containerRef}>
            {!mapMetadata.value ||
            spawnpointsWithPosition.value.length === 0 ||
            !containerDimensions.value ||
            !fittedNaturalMapDimensions.value ? (
                <LoadingSpinner />
            ) : (
                <div
                    style={{
                        width: containerDimensions.value.width,
                        height: containerDimensions.value.height,
                    }}
                    onWheel={listeners.onWheel}
                    onPointerDown={listeners.onPointerDown}
                    onPointerMove={listeners.onPointerMove}
                    onPointerUp={(event) => {
                        if (!isPanning.value) {
                            $selectedSpawnpoint.value = undefined;
                        }

                        listeners.onPointerUp(event);
                    }}
                    onPointerLeave={listeners.onPointerLeave}
                    onPointerCancel={listeners.onPointerCancel}
                    className={'touch-none'}
                >
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

                        {spawnpointsWithPosition.value.map((spawnpoint, index) => (
                            <circle
                                class={tw(
                                    'cursor-pointer fill-stone-700/80 stroke-stone-300/50 hover:fill-stone-500/80',
                                    spawnpoint.highlighted &&
                                        'fill-yellow-600/80 stroke-yellow-300 hover:fill-yellow-500',
                                )}
                                key={index}
                                cx={spawnpoint.svgPosition.x}
                                cy={spawnpoint.svgPosition.y}
                                r={0.01 + viewBoxScale.value * (spawnpoint.highlighted ? 6 : 4)}
                                stroke-width={viewBoxScale.value}
                                onClick={(event) => onSpawnpointClick(event, spawnpoint)}
                            />
                        ))}
                    </svg>
                </div>
            )}
        </div>
    );
}
