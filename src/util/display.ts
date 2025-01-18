export function randomNumberBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (1 + max - min)) + min;
}

export function formatBigNumber(number: number): string {
    if (number < 1000) {
        return number.toString();
    } else if (number < 1000000) {
        return Math.round(number / 1000).toString() + 'k';
    } else {
        return Math.round(number / 1000000).toString() + 'm';
    }
}

export function normalizeProbabilities<T extends { relativeProbability: number }>(
    objectsWithRelativeProbabilities: T[],
): (T & { probability: number })[] {
    const relativeProbabilitiesSum = objectsWithRelativeProbabilities.reduce(
        (acc, cur) => (acc += cur.relativeProbability),
        0,
    );
    return objectsWithRelativeProbabilities.map((item) => ({
        ...item,
        probability: item.relativeProbability / relativeProbabilitiesSum,
    }));
}
