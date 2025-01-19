import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { Dimensions } from '../model/common';
import { throttle } from './throttle';
import { bounded } from './math';

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
        if (elementDimensions.value == null || initiallyCentered.value == null) {
            return { x: { min: -Infinity, max: Infinity }, y: { min: -Infinity, max: Infinity } };
        }

        return {
            x: {
                min: -elementDimensions.value.width / 2 + initialViewBoxPosition.value.x,
                max: elementDimensions.value.width / 2 + initialViewBoxPosition.value.x,
            },
            y: {
                min: -elementDimensions.value.height + initiallyCentered.value.height / 2,
                max: initiallyCentered.value.height / 2,
            },
        };
    });

    const maxScale = 2;
    const minScale = 0.05;

    const onSvgWheel = (event: WheelEvent) => {
        if (!elementDimensions.value) {
            return;
        }

        event.preventDefault();

        const scaleFactor = event.deltaY < 0 ? 1 / 1.1 : 1.1;
        const newScale = bounded(viewBoxScale.value * scaleFactor, minScale, maxScale);

        // calculate (relative) mouse position in [0, 1]
        const relativeX = event.offsetX / elementDimensions.value.width;
        const relativeY = event.offsetY / elementDimensions.value.height;

        // calculate how much the dimensions will change
        const newWidth = elementDimensions.value.width * newScale;
        const newHeight = elementDimensions.value.height * newScale;
        const deltaWidth = newWidth - viewBoxDimensions.value.width;
        const deltaHeight = newHeight - viewBoxDimensions.value.height;

        // adjust viewBox position to keep mouse position fixed
        viewBoxPosition.value = {
            x: viewBoxPosition.value.x - deltaWidth * relativeX,
            y: viewBoxPosition.value.y - deltaHeight * relativeY,
        };

        viewBoxScale.value = newScale;
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

        const limits = viewBoxPositionLimits.value;

        viewBoxPosition.value = {
            x: bounded(viewBoxPosition.value.x + deltaX, limits.x.min, limits.x.max),
            y: bounded(viewBoxPosition.value.y + deltaY, limits.y.min, limits.y.max),
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
            `${viewBoxPosition.value.x} ${viewBoxPosition.value.y} ${viewBoxDimensions.value.width} ${viewBoxDimensions.value.height}`,
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
