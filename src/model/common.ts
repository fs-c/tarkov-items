export interface Point {
    x: number;
    y: number;
}

export interface PointWithHeight extends Point {
    height: number;
}

export interface Dimensions {
    width: number;
    height: number;
}
