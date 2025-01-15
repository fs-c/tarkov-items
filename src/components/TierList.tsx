import { useComputed, useSignal } from '@preact/signals';
import { Location } from '../model/loot-data';
import { allItemMetadata, averageSpawnsPerMap } from '../store/data';
import { ItemMetadata, ItemType } from '../model/item-metadata';
import { twMerge as tw } from 'tailwind-merge';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { formatBigNumber, randomNumberBetween } from '../util/display';

interface FrontendItemData extends ItemMetadata {
    pricePerSlot: number;
    averageCount: number;
}

interface TierMetadata {
    name: string;
    color: string;
    rgbColor: string;
    percentile: number;
}

export function TierList() {
    const selectedMaps = useSignal(Object.values(Location));
    const minPricePerSlot = useSignal(15000);
    const allowedItemTypes = useSignal([
        ItemType.barter,
        ItemType.keys,
        ItemType.meds,
        ItemType.provisions,
        ItemType.mods,
    ]);

    const tierMetadata = useSignal<TierMetadata[]>([
        { name: 'Common', color: 'bg-gray-700', rgbColor: '#374151', percentile: 0.85 },
        { name: 'Uncommon', color: 'bg-emerald-600', rgbColor: '#047857', percentile: 0.95 },
        { name: 'Rare', color: 'bg-sky-700', rgbColor: '#0369a1', percentile: 0.975 },
        { name: 'Epic', color: 'bg-fuchsia-700', rgbColor: '#a21caf', percentile: 0.985 },
        { name: 'Legendary', color: 'bg-yellow-600', rgbColor: '#a16207', percentile: 1 },
    ]);

    const averageSpawns = useComputed(() => {
        const averageSpawns = new Map<string, number>();

        for (const map of selectedMaps.value) {
            const averageSpawnsForMap = averageSpawnsPerMap.value.get(map);
            if (!averageSpawnsForMap) {
                continue;
            }

            for (const [item, count] of averageSpawnsForMap) {
                averageSpawns.set(item, (averageSpawns.get(item) ?? 0) + count);
            }
        }

        return averageSpawns;
    });

    const averageSpawnsWithMetadata = useComputed(() => {
        const averageSpawnsWithMetadata: FrontendItemData[] = [];

        for (const [item, averageCount] of averageSpawns.value) {
            const metadata = allItemMetadata.value.get(item);
            if (!metadata) {
                continue;
            }

            const itemData: FrontendItemData = {
                ...metadata,
                averageCount,
                pricePerSlot: Math.round(
                    metadata.lastLowPrice / (metadata.width * metadata.height),
                ),
            };

            averageSpawnsWithMetadata.push(itemData);
        }

        return averageSpawnsWithMetadata;
    });

    const tiers = useComputed(() => {
        const filteredItems = averageSpawnsWithMetadata.value.filter(
            (item) =>
                item.pricePerSlot >= minPricePerSlot.value &&
                item.types.some((type) => allowedItemTypes.value.includes(type)),
        );
        const spawnrates = filteredItems.map((item) => item.averageCount);
        const spawnRatesMax = Math.max(...spawnrates);
        const spawnRatesMin = Math.min(...spawnrates);

        const tierBoundaries = tierMetadata.value.map(
            ({ percentile }) => spawnRatesMax - (spawnRatesMax - spawnRatesMin) * percentile,
        );

        const itemsSortedBySpawnrate = filteredItems.sort(
            (a, b) => b.averageCount - a.averageCount,
        );

        return itemsSortedBySpawnrate
            .reduce(
                (tiers, item) => {
                    const tierIndex = tierBoundaries.findIndex(
                        (boundary) => item.averageCount >= boundary,
                    );
                    if (tierIndex === -1) {
                        return tiers;
                    }

                    tiers[tierIndex].push(item);

                    return tiers;
                },
                tierBoundaries.map(() => [] as FrontendItemData[]),
            )
            .map((tier) => tier.sort((a, b) => b.pricePerSlot - a.pricePerSlot));
    });

    return (
        <div className={'flex max-w-screen-xl flex-col divide-y divide-gray-800 xl:max-w-full'}>
            {tiers.value.map((tier, index) => (
                <Tier
                    key={index}
                    items={tier}
                    metadata={tierMetadata.value[index]}
                    className='py-16'
                />
            ))}
        </div>
    );
}

function Tier({
    items,
    metadata,
    className,
}: {
    items: FrontendItemData[];
    metadata: TierMetadata;
    className?: string;
}) {
    const numberOfItemsToShow = useSignal(40);
    const itemsToShow = useComputed(() => items.slice(0, numberOfItemsToShow.value));

    const canvasContainer = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);

    useLayoutEffect(() => {
        if (!canvas.current || !canvasContainer.current) {
            return;
        }

        canvas.current.width = canvasContainer.current.clientWidth;
        canvas.current.height = canvasContainer.current.clientHeight;

        const ctx = canvas.current.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.beginPath();

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < 4; i++) {
            const randomOffsetX = Math.random() * (ctx.canvas.width / 4);
            const randomOffsetY = Math.random() * (ctx.canvas.height / 4);

            ctx.globalAlpha = randomNumberBetween(0.3, 0.6);

            ctx.arc(
                ctx.canvas.width / 4 + randomOffsetX,
                ctx.canvas.height / 4 + randomOffsetY,
                randomNumberBetween(50, 200),
                0,
                Math.PI * 2,
                false,
            );
            ctx.fillStyle = metadata.rgbColor;
            ctx.filter = 'blur(100px)';
        }
        ctx.fill();

        ctx.closePath();
    }, [canvas, canvasContainer]);

    return (
        <div
            ref={canvasContainer}
            className={tw('relative flex flex-col gap-4 xl:flex-row xl:gap-0', className)}
        >
            <div
                className={
                    'z-10 px-4 xl:flex xl:min-w-max xl:flex-grow xl:basis-0 xl:flex-row xl:justify-end xl:px-0'
                }
            >
                <div
                    className={
                        'flex flex-row justify-between gap-2 xl:flex-col xl:items-end xl:justify-normal'
                    }
                >
                    <p
                        className={tw(
                            'h-fit w-fit rounded-xl px-3 py-2 text-xl font-semibold leading-tight',
                            metadata.color,
                        )}
                    >
                        {metadata.name}
                    </p>

                    <div className={'flex flex-col items-end text-gray-400'}>
                        <p>{metadata.percentile * 100}% Percentile</p>

                        <p>{items.length} items</p>
                    </div>
                </div>
            </div>

            <div
                className={
                    'z-10 flex flex-row flex-wrap gap-4 px-4 xl:w-full xl:max-w-screen-lg xl:px-8'
                }
            >
                {itemsToShow.value.length === 0
                    ? [...Array<unknown>(numberOfItemsToShow.value)].map((_, index) => (
                          <div key={index} className={'h-16 w-16 animate-pulse bg-gray-700'}></div>
                      ))
                    : itemsToShow.value.map((item) => (
                          <div className={'group relative h-20 w-20'}>
                              <span
                                  className={
                                      'absolute bottom-0 right-0 mx-2 my-1 rounded-md px-2 py-1 font-mono leading-none text-gray-300 backdrop-blur'
                                  }
                              >
                                  {formatBigNumber(item.pricePerSlot)}₽
                              </span>

                              <span
                                  className={
                                      'absolute left-0 top-0 mx-2 my-1 hidden break-all rounded-md px-2 py-1 font-mono leading-none text-gray-300 backdrop-blur-lg group-hover:block'
                                  }
                              >
                                  {item.shortName}
                              </span>

                              <img
                                  src={item.iconLink}
                                  alt={item.shortName}
                                  className={'h-full w-full'}
                              />
                          </div>
                      ))}
            </div>

            <div className={'hidden xl:block xl:flex-grow xl:basis-0'}></div>

            <canvas ref={canvas} className={'absolute left-0 top-0 h-full w-full'}></canvas>
        </div>
    );
}
