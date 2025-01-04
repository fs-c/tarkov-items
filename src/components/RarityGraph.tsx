import { useComputed, useSignal, Signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import * as d3 from 'd3';
import { allItemMetadata } from '../store/loot-data';
import { Location } from '../model/loot-data';
import { ItemMetadata, ItemType } from '../model/item-metadata';
import {
    averageItemsPerContainerPerMap,
    averageContainersPerMap,
} from '../store/query/spawns-per-map';

interface FrontendItemData extends ItemMetadata {
    pricePerSlot: number;
    rarity: number;
}

const Axis = ({
    scale,
    position,
    dimensions,
}: {
    scale: d3.ScaleLinear<number, number>;
    position: 'left' | 'bottom';
    dimensions: { width: number; height: number };
}) => {
    const ticks = scale.ticks();

    const axisHeight = 10;

    return (
        <g>
            {ticks.map((tick) => (
                <g
                    key={tick}
                    transform={`translate(${position === 'bottom' ? scale(tick) : 0}, ${position === 'bottom' ? dimensions.height - axisHeight : scale(tick)})`}
                >
                    <text
                        x={position === 'bottom' ? 0 : 20}
                        y={position === 'bottom' ? -20 : 0}
                        dy={position === 'bottom' ? '0.71em' : '0.32em'}
                        text-anchor={position === 'bottom' ? 'middle' : 'start'}
                        class={'fill-gray-400'}
                    >
                        {tick}
                    </text>
                    <line
                        x2={position === 'bottom' ? 0 : axisHeight}
                        y2={position === 'bottom' ? axisHeight : 0}
                        class={'stroke-gray-400'}
                    />
                </g>
            ))}
        </g>
    );
};

export function RarityGraph({
    minimumPricePerSlot,
    itemTypes,
    maps,
    containers,
    selectedItemId,
}: {
    minimumPricePerSlot: Signal<number>;
    itemTypes: Signal<ItemType[]>;
    maps: Signal<Location[]>;
    containers: Signal<string[]>;
    selectedItemId: Signal<string | undefined>;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const width = useSignal(0);
    const height = useSignal(0);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries.length !== 1 || entries[0].borderBoxSize.length !== 1) {
                console.warn('resize observer returned unexpected entries', entries);
                return;
            }

            width.value = entries[0].borderBoxSize[0].inlineSize;
            height.value = entries[0].borderBoxSize[0].blockSize;
        });

        if (wrapperRef.current != null) {
            resizeObserver.observe(wrapperRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [wrapperRef.current]);

    // this already considers the selected containers and maps
    const averageSpawnsPerItem = useComputed(() => {
        const averageSpawnsPerItem = new Map<string, number>();

        for (const map of maps.value) {
            const averageContainers = averageContainersPerMap.value.get(map);
            const averageItemsPerContainer = averageItemsPerContainerPerMap.value.get(map);

            if (!averageContainers || !averageItemsPerContainer) {
                continue;
            }

            for (const [container, averageContainerCount] of averageContainers) {
                if (!containers.value.includes(container)) {
                    continue;
                }

                const items = averageItemsPerContainer.get(container);
                if (!items) {
                    continue;
                }

                for (const [item, averageItemCount] of items) {
                    averageSpawnsPerItem.set(
                        item,
                        (averageSpawnsPerItem.get(item) ?? 0) +
                            averageItemCount * averageContainerCount,
                    );
                }
            }
        }

        return averageSpawnsPerItem;
    });

    const averageSpawnsWithMetadata = useComputed(() => {
        const averageSpawnsWithMetadata = [];

        for (const [item, averageCount] of averageSpawnsPerItem.value) {
            const metadata = allItemMetadata.value.get(item);
            if (!metadata) {
                continue;
            }

            const itemData: FrontendItemData = {
                ...metadata,
                rarity: 1 / averageCount,
                pricePerSlot: Math.round(
                    metadata.lastLowPrice / (metadata.width * metadata.height),
                ),
            };

            if (
                itemData.pricePerSlot > minimumPricePerSlot.value &&
                itemData.types.some((type) => itemTypes.value.includes(type))
            ) {
                averageSpawnsWithMetadata.push(itemData);
            }
        }

        return averageSpawnsWithMetadata;
    });

    const transform = useSignal(d3.zoomIdentity);

    const initialXScale = useComputed(() =>
        d3
            .scaleLinear()
            .domain(
                d3.extent(averageSpawnsWithMetadata.value, (d) => d.pricePerSlot) as [
                    number,
                    number,
                ],
            )
            .range([0, width.value]),
    );
    const initialYScale = useComputed(() =>
        d3
            .scaleLinear()
            .domain(d3.extent(averageSpawnsWithMetadata.value, (d) => d.rarity) as [number, number])
            .range([height.value, 0]),
    );

    const xScale = useComputed(() => transform.value.rescaleX(initialXScale.value));
    const yScale = useComputed(() => transform.value.rescaleY(initialYScale.value));

    useEffect(() => {
        if (svgRef.current == null) {
            return;
        }

        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .on('zoom', (event: { transform: d3.ZoomTransform }) => {
                transform.value = event.transform;
            });

        d3.select(svgRef.current).call(zoom);
    }, []);

    const onItemClick = (item: FrontendItemData) => {
        if (item.id === selectedItemId.value) {
            selectedItemId.value = undefined;
        } else {
            selectedItemId.value = item.id;
        }
    };

    return (
        <div ref={wrapperRef} className='h-full w-full bg-gray-950'>
            <svg ref={svgRef} width={width} height={height}>
                <Axis
                    scale={xScale.value}
                    position={'bottom'}
                    dimensions={{ width: width.value, height: height.value }}
                />

                <Axis
                    scale={yScale.value}
                    position={'left'}
                    dimensions={{ width: width.value, height: height.value }}
                />

                <g fill={'white'} stroke={'white'} width={width} height={height}>
                    {averageSpawnsWithMetadata.value.map((item) => (
                        <image
                            href={item.iconLink}
                            height={40}
                            width={40}
                            x={xScale.value(item.pricePerSlot)}
                            y={yScale.value(item.rarity)}
                            onClick={() => {
                                onItemClick(item);
                            }}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}
