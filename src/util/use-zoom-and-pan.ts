import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { Dimensions } from '../model/common';
import { throttle } from './throttle';
import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';

export function useZoomAndPan(
    containerRef: RefObject<HTMLElement>,
    containerDimensions: ReadonlySignal<Dimensions | undefined>,
    initiallyCentered: ReadonlySignal<Dimensions | undefined>,
): {
    viewBoxString: ReadonlySignal<string>;
    viewBoxScale: ReadonlySignal<number>;
    isPanning: ReadonlySignal<boolean>;
} {
    const initialViewBoxPosition = useComputed(() => {
        if (containerDimensions.value == null || initiallyCentered.value == null) {
            return { x: 0, y: 0 };
        }

        const { width: containerWidth, height: containerHeight } = containerDimensions.value;

        const xOffset = -(containerWidth - initiallyCentered.value.width) / 2;
        const yOffset = -(containerHeight - initiallyCentered.value.height) / 2;

        return { x: xOffset, y: yOffset };
    });

    const viewBoxPosition = useSignal({ x: 0, y: 0 });

    // todo: this is dubious
    useSignalEffect(() => {
        viewBoxPosition.value = initialViewBoxPosition.value;
    });

    const viewBoxScale = useSignal(1);
    const viewBoxDimensions = useComputed(() => ({
        width: (containerDimensions.value?.width ?? 0) * viewBoxScale.value,
        height: (containerDimensions.value?.height ?? 0) * viewBoxScale.value,
    }));

    const viewBoxPositionLimits = useComputed(() => {
        const initialPosition = initialViewBoxPosition.value;

        const minViewBoxPositionX = initialPosition.x - (containerDimensions.value?.width ?? 0) / 2;
        const minViewBoxPositionY =
            initialPosition.y - (containerDimensions.value?.height ?? 0) / 2;
        const maxViewBoxPositionX = initialPosition.x + (containerDimensions.value?.width ?? 0) / 2;
        const maxViewBoxPositionY =
            initialPosition.y + (containerDimensions.value?.height ?? 0) / 2;

        return {
            minViewBoxPositionX,
            minViewBoxPositionY,
            maxViewBoxPositionX,
            maxViewBoxPositionY,
        };
    });

    const limitedViewBoxPosition = useComputed(() => {
        return {
            x: Math.min(
                Math.max(viewBoxPosition.value.x, viewBoxPositionLimits.value.minViewBoxPositionX),
                viewBoxPositionLimits.value.maxViewBoxPositionX,
            ),
            y: Math.min(
                Math.max(viewBoxPosition.value.y, viewBoxPositionLimits.value.minViewBoxPositionY),
                viewBoxPositionLimits.value.maxViewBoxPositionY,
            ),
        };
    });

    const maxScale = 2;
    const minScale = 0.05;

    const onSvgWheel = (event: WheelEvent) => {
        if (!containerDimensions.value) {
            return;
        }

        event.preventDefault();

        const oldViewBoxDimensions = viewBoxDimensions.value;

        const scaleFactor = event.deltaY < 0 ? 1 / 1.1 : 1.1;

        viewBoxScale.value = Math.min(
            Math.max(viewBoxScale.value * scaleFactor, minScale),
            maxScale,
        );

        // translate mouse position to viewBox coordinates
        const mouseX =
            (event.offsetX / containerDimensions.value.width) * viewBoxDimensions.value.width +
            viewBoxPosition.value.x;
        const mouseY =
            (event.offsetY / containerDimensions.value.height) * viewBoxDimensions.value.height +
            viewBoxPosition.value.y;

        // adjust viewBox position to keep the mouse position in place
        // todo: something about this calculation isn't right, the result is not perfect
        const viewBoxPositionX =
            mouseX -
            ((mouseX - viewBoxPosition.value.x) / oldViewBoxDimensions.width) *
                viewBoxDimensions.value.width;
        const viewBoxPositionY =
            mouseY -
            ((mouseY - viewBoxPosition.value.y) / oldViewBoxDimensions.height) *
                viewBoxDimensions.value.height;

        viewBoxPosition.value = {
            x: viewBoxPositionX,
            y: viewBoxPositionY,
        };
    };

    const mouseIsPressed = useSignal(false);
    const lastSvgPanPosition = useSignal({ x: 0, y: 0 });

    const onSvgMouseDown = (event: MouseEvent) => {
        event.preventDefault();

        mouseIsPressed.value = true;
        lastSvgPanPosition.value = { x: event.offsetX, y: event.offsetY };
    };

    const isPanning = useSignal(false);

    const onSvgMouseMove = (event: MouseEvent) => {
        if (!mouseIsPressed.value || !containerDimensions.value) {
            return;
        }

        isPanning.value = true;

        const deltaX =
            (lastSvgPanPosition.value.x - event.offsetX) *
            (viewBoxDimensions.value.width / containerDimensions.value.width);
        const deltaY =
            (lastSvgPanPosition.value.y - event.offsetY) *
            (viewBoxDimensions.value.height / containerDimensions.value.height);

        viewBoxPosition.value = {
            x: viewBoxPosition.value.x + deltaX,
            y: viewBoxPosition.value.y + deltaY,
        };

        lastSvgPanPosition.value = { x: event.offsetX, y: event.offsetY };
    };

    const onSvgMouseUp = (event: MouseEvent) => {
        event.stopPropagation();

        mouseIsPressed.value = false;
        isPanning.value = false;
    };

    const onSvgMouseLeave = () => {
        mouseIsPressed.value = false;
    };

    const viewBoxString = useComputed(
        () =>
            `${limitedViewBoxPosition.value.x} ${limitedViewBoxPosition.value.y} ${viewBoxDimensions.value.width} ${viewBoxDimensions.value.height}`,
    );

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const throttledOnSvgWheel = throttle(onSvgWheel, 120);
        const throttledOnSvgMouseDown = throttle(onSvgMouseDown, 120);
        const throttledOnSvgMouseMove = throttle(onSvgMouseMove, 120);
        const throttledOnSvgMouseUp = throttle(onSvgMouseUp, 120);
        const throttledOnSvgMouseLeave = throttle(onSvgMouseLeave, 120);

        // we have to set passive to false because otherwise preventDefault() will not work
        // afaict this is only required for safari
        containerRef.current.addEventListener('wheel', throttledOnSvgWheel, { passive: false });
        containerRef.current.addEventListener('mousedown', throttledOnSvgMouseDown, {
            passive: false,
        });
        containerRef.current.addEventListener('mousemove', throttledOnSvgMouseMove, {
            passive: false,
        });
        containerRef.current.addEventListener('mouseup', throttledOnSvgMouseUp, {
            passive: false,
        });
        containerRef.current.addEventListener('mouseleave', throttledOnSvgMouseLeave, {
            passive: false,
        });

        return () => {
            containerRef.current?.removeEventListener('wheel', throttledOnSvgWheel);
            containerRef.current?.removeEventListener('mousedown', throttledOnSvgMouseDown);
            containerRef.current?.removeEventListener('mousemove', throttledOnSvgMouseMove);
            containerRef.current?.removeEventListener('mouseup', throttledOnSvgMouseUp);
            containerRef.current?.removeEventListener('mouseleave', throttledOnSvgMouseLeave);
        };
    }, [containerRef.current]);

    return {
        viewBoxString,
        viewBoxScale,
        isPanning,
    };
}
