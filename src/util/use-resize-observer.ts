import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { ReadonlySignal, useSignal } from '@preact/signals';
import { Dimensions } from '../model/common';

export function useResizeObserver(elementRef: RefObject<HTMLElement>): ReadonlySignal<Dimensions> {
    const dimensions = useSignal({ width: 0, height: 0 });

    useEffect(() => {
        if (elementRef.current == null) {
            return;
        }

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries.length !== 1 || entries[0].borderBoxSize.length !== 1) {
                console.warn('resize observer returned unexpected entries', entries);
                return;
            }

            const width = entries[0].borderBoxSize[0].inlineSize;
            const height = entries[0].borderBoxSize[0].blockSize;

            if (width !== dimensions.value.width || height !== dimensions.value.height) {
                dimensions.value = { width, height };
            }
        });

        resizeObserver.observe(elementRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [elementRef.current]);

    return dimensions;
}
