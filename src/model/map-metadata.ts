export interface MapMetadata {
    key: string;
    /**
     * [scale x, margin x, scale y, margin y]
     */
    transform: [number, number, number, number];
    coordinateRotation: number;
    /**
     * [[top left x, top left y], [bottom right x, bottom right y]]
     */
    bounds: [[number, number], [number, number]];
    heightRange: [number, number];
    svgPath: string;
}

export interface MapMetadataCollection {
    normalizedName: string;
    maps: MapMetadata[];
}
