import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { Dimensions } from '../model/common';
import { throttle } from './throttle';

export function useZoomAndPan(
    elementDimensions: ReadonlySignal<Dimensions | undefined>,
    initiallyCentered: ReadonlySignal<Dimensions | undefined>,
): {
    viewBoxString: ReadonlySignal<string>;
    viewBoxScale: ReadonlySignal<number>;
    isPanning: ReadonlySignal<boolean>;
    onSvgWheel: (event: WheelEvent) => void;
    onSvgMouseDown: (event: MouseEvent) => void;
    onSvgMouseMove: (event: MouseEvent) => void;
    onSvgMouseUp: (event: MouseEvent) => void;
    onSvgMouseLeave: () => void;
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

    // todo: this is dubious
    useSignalEffect(() => {
        viewBoxPosition.value = initialViewBoxPosition.value;
    });

    const viewBoxScale = useSignal(1);
    const viewBoxDimensions = useComputed(() => ({
        width: (elementDimensions.value?.width ?? 0) * viewBoxScale.value,
        height: (elementDimensions.value?.height ?? 0) * viewBoxScale.value,
    }));

    const viewBoxPositionLimits = useComputed(() => {
        const initialPosition = initialViewBoxPosition.value;

        const minViewBoxPositionX = initialPosition.x - (elementDimensions.value?.width ?? 0) / 2;
        const minViewBoxPositionY = initialPosition.y - (elementDimensions.value?.height ?? 0) / 2;
        const maxViewBoxPositionX = initialPosition.x + (elementDimensions.value?.width ?? 0) / 2;
        const maxViewBoxPositionY = initialPosition.y + (elementDimensions.value?.height ?? 0) / 2;

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
        if (!elementDimensions.value) {
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
            (event.offsetX / elementDimensions.value.width) * viewBoxDimensions.value.width +
            viewBoxPosition.value.x;
        const mouseY =
            (event.offsetY / elementDimensions.value.height) * viewBoxDimensions.value.height +
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
        if (!mouseIsPressed.value || !elementDimensions.value) {
            return;
        }

        isPanning.value = true;

        const deltaX =
            (lastSvgPanPosition.value.x - event.offsetX) *
            (viewBoxDimensions.value.width / elementDimensions.value.width);
        const deltaY =
            (lastSvgPanPosition.value.y - event.offsetY) *
            (viewBoxDimensions.value.height / elementDimensions.value.height);

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

    return {
        viewBoxString,
        viewBoxScale,
        isPanning,
        onSvgWheel: throttle(onSvgWheel, 120),
        onSvgMouseDown: throttle(onSvgMouseDown, 120),
        onSvgMouseMove: throttle(onSvgMouseMove, 120),
        onSvgMouseUp: throttle(onSvgMouseUp, 120),
        onSvgMouseLeave: throttle(onSvgMouseLeave, 120),
    };
}
