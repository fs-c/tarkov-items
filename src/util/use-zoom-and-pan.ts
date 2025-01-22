import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { Dimensions, Point } from '../model/common';
import { throttle } from './throttle';
import { bounded, centerBetweenPoints, distanceBetweenPoints } from './math';
import { useMemo, useRef } from 'preact/hooks';

class PointerEventCache {
    private readonly pointerIds: number[] = [];
    private readonly cache = new Map<number, PointerEvent>();

    public add(event: PointerEvent) {
        if (!this.cache.has(event.pointerId)) {
            this.pointerIds.push(event.pointerId);
        }

        this.cache.set(event.pointerId, event);
    }

    public getPointerIds() {
        return this.pointerIds;
    }

    public get(pointerId: number) {
        return this.cache.get(pointerId);
    }

    public remove(pointerId: number) {
        this.cache.delete(pointerId);

        const pointerIdsIndex = this.pointerIds.indexOf(pointerId);
        if (pointerIdsIndex !== -1) {
            this.pointerIds.splice(pointerIdsIndex, 1);
        }
    }
}

export function useZoomAndPan(
    elementDimensions: ReadonlySignal<Dimensions | undefined>,
    initiallyCentered: ReadonlySignal<Dimensions | undefined>,
): {
    viewBoxString: ReadonlySignal<string>;
    viewBoxScale: ReadonlySignal<number>;
    isPanning: ReadonlySignal<boolean>;
    listeners: {
        onWheel: (event: WheelEvent) => void;
        onPointerDown: (event: PointerEvent) => void;
        onPointerMove: (event: PointerEvent) => void;
        onPointerUp: (event: PointerEvent) => void;
        onPointerCancel: (event: PointerEvent) => void;
        onPointerLeave: (event: PointerEvent) => void;
    };
} {
    const initialViewBoxPosition = useComputed(() => {
        if (elementDimensions.value == null || initiallyCentered.value == null) {
            return { x: 0, y: 0 };
        }

        const xOffset = -(elementDimensions.value.width - initiallyCentered.value.width) / 2;
        const yOffset = -(elementDimensions.value.height - initiallyCentered.value.height) / 2;

        return { x: xOffset, y: yOffset };
    });

    const viewBoxPosition = useSignal({ x: 0, y: 0 });

    // when initial view box changed, reset our state
    useSignalEffect(() => {
        viewBoxPosition.value = initialViewBoxPosition.value;
        viewBoxScale.value = 1;
    });

    const viewBoxScale = useSignal(1);
    const viewBoxDimensions = useComputed(() => ({
        width: (elementDimensions.value?.width ?? 0) * viewBoxScale.value,
        height: (elementDimensions.value?.height ?? 0) * viewBoxScale.value,
    }));

    const viewBoxPositionLimits = useComputed(() => {
        if (elementDimensions.value == null || initiallyCentered.value == null) {
            return { x: { min: -Infinity, max: Infinity }, y: { min: -Infinity, max: Infinity } };
        }

        return {
            x: {
                min: Math.min(
                    -viewBoxDimensions.value.width / 2,
                    -viewBoxDimensions.value.width + initiallyCentered.value.width / 2,
                ),
                max: Math.max(
                    initiallyCentered.value.width - viewBoxDimensions.value.width / 2,
                    initiallyCentered.value.width / 2,
                ),
            },
            y: {
                min: Math.min(
                    -viewBoxDimensions.value.height / 2,
                    -viewBoxDimensions.value.height + initiallyCentered.value.height / 2,
                ),
                max: Math.max(
                    initiallyCentered.value.height - viewBoxDimensions.value.height / 2,
                    initiallyCentered.value.height / 2,
                ),
            },
        };
    });

    const maxScale = 2;
    const minScale = 0.01;

    const zoomIntoPoint = (newScale: number, point: Point) => {
        if (!elementDimensions.value) {
            console.warn('attempted to scale without knowing element dimensions');
            return;
        }

        // calculate (relative) point position in [0, 1] (like u/v)
        const relativeX = point.x / elementDimensions.value.width;
        const relativeY = point.y / elementDimensions.value.height;

        // calculate how much the dimensions will change
        const newWidth = elementDimensions.value.width * newScale;
        const newHeight = elementDimensions.value.height * newScale;
        const deltaWidth = newWidth - viewBoxDimensions.value.width;
        const deltaHeight = newHeight - viewBoxDimensions.value.height;

        const limits = viewBoxPositionLimits.value;
        // adjust viewBox position to keep point fixed relative to element
        viewBoxPosition.value = {
            x: bounded(
                viewBoxPosition.value.x - deltaWidth * relativeX,
                limits.x.min,
                limits.x.max,
            ),
            y: bounded(
                viewBoxPosition.value.y - deltaHeight * relativeY,
                limits.y.min,
                limits.y.max,
            ),
        };

        viewBoxScale.value = newScale;
    };

    const onWheel = (event: WheelEvent) => {
        event.preventDefault();

        const scaleFactor = event.deltaY < 0 ? 1 / 1.1 : 1.1;
        const newScale = bounded(viewBoxScale.value * scaleFactor, minScale, maxScale);

        zoomIntoPoint(newScale, { x: event.offsetX, y: event.offsetY });
    };

    const mouseIsPressed = useSignal(false);
    const lastSvgPanPosition = useSignal({ x: 0, y: 0 });

    const pointerEventCache = useMemo(() => new PointerEventCache(), []);

    const onPointerDown = (event: PointerEvent) => {
        event.preventDefault();

        pointerEventCache.add(event);

        console.log('onPointerDown', { pointerId: event.pointerId, event });

        mouseIsPressed.value = true;
        lastSvgPanPosition.value = { x: event.offsetX, y: event.offsetY };
    };

    const isPanning = useSignal(false);
    const previousPinchZoomDistance = useRef(0);

    const onPointerMove = (event: PointerEvent) => {
        if (!mouseIsPressed.value || !elementDimensions.value) {
            return;
        }

        pointerEventCache.add(event);

        const cachedPointerIds = pointerEventCache.getPointerIds();

        console.log('onPointerMove', {
            pointerId: event.pointerId,
            cachedPointerIds,
            event,
        });

        if (cachedPointerIds.length === 1) {
            // we have exactly one active pointer, we are panning
            isPanning.value = true;

            const deltaX =
                (lastSvgPanPosition.value.x - event.offsetX) *
                (viewBoxDimensions.value.width / elementDimensions.value.width);
            const deltaY =
                (lastSvgPanPosition.value.y - event.offsetY) *
                (viewBoxDimensions.value.height / elementDimensions.value.height);

            const limits = viewBoxPositionLimits.value;
            viewBoxPosition.value = {
                x: bounded(viewBoxPosition.value.x + deltaX, limits.x.min, limits.x.max),
                y: bounded(viewBoxPosition.value.y + deltaY, limits.y.min, limits.y.max),
            };

            lastSvgPanPosition.value = { x: event.offsetX, y: event.offsetY };
        } else if (cachedPointerIds.length === 2) {
            // we have two active pointers, we are pinch zooming
            const previousEvent = pointerEventCache.get(cachedPointerIds[0]!);
            const currentEvent = pointerEventCache.get(cachedPointerIds[1]!);

            console.log({ previousEvent, currentEvent });

            if (!previousEvent || !currentEvent) {
                console.warn('cache contained null events');
                return;
            }

            const pinchDistance = distanceBetweenPoints(
                previousEvent.offsetX,
                previousEvent.offsetY,
                currentEvent.offsetX,
                currentEvent.offsetY,
            );

            if (previousPinchZoomDistance.current > 0) {
                const scaleFactor = pinchDistance / previousPinchZoomDistance.current;
                const newScale = bounded(viewBoxScale.value * scaleFactor, minScale, maxScale);

                const center = centerBetweenPoints(
                    previousEvent.offsetX,
                    previousEvent.offsetY,
                    currentEvent.offsetX,
                    currentEvent.offsetY,
                );

                zoomIntoPoint(newScale, center);
            }

            previousPinchZoomDistance.current = pinchDistance;
        } else {
            console.warn('unexpected number of active pointers', cachedPointerIds);
        }
    };

    const onPointerUp = (event: PointerEvent) => {
        if (event.type === 'pointercancel') {
            console.warn('got pointer cancel event, browser started handling the touch!');
        }

        event.stopPropagation();

        console.log('onPointerUp', { pointerId: event.pointerId, event });

        pointerEventCache.remove(event.pointerId);

        mouseIsPressed.value = false;
        isPanning.value = false;
    };

    const viewBoxString = useComputed(
        () =>
            `${viewBoxPosition.value.x} ${viewBoxPosition.value.y} ${viewBoxDimensions.value.width} ${viewBoxDimensions.value.height}`,
    );

    return {
        viewBoxString,
        viewBoxScale,
        isPanning,
        listeners: {
            onWheel: throttle(onWheel, 120),
            onPointerDown,
            onPointerMove: throttle(onPointerMove, 120),
            onPointerUp,
            onPointerLeave: onPointerUp,
            onPointerCancel: onPointerUp,
        },
    };
}
