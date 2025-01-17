const uninitializedLastResult = Symbol('uninitializedLastResult');

export function throttle<R, T extends (...args: never[]) => R>(
    fn: T,
    maxHz: number,
): (...args: Parameters<T>) => R {
    let lastTime = 0;
    let lastResult: R | typeof uninitializedLastResult = uninitializedLastResult;

    return (...args: never[]): R => {
        const now = performance.now();
        if (now - lastTime >= 1000 / maxHz) {
            lastTime = now;
            lastResult = fn(...args);
        }

        if (lastResult === uninitializedLastResult) {
            throw new Error('throttle function does not have last result');
        }

        return lastResult;
    };
}
