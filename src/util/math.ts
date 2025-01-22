import { Point } from '../model/common';

export function bounded(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

// not using Point type because this is only used for events atm and i don't want to create
// throwaway Point objects all the time
export function distanceBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function centerBetweenPoints(x1: number, y1: number, x2: number, y2: number): Point {
    return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
    };
}
