export enum Location {
    Customs = 'bigmap',
    FactoryDay = 'factory4_day',
    FactoryNight = 'factory4_night',
    Interchange = 'interchange',
    Labs = 'laboratory',
    Lighthouse = 'lighthouse',
    Reserve = 'rezervbase',
    GroundZeroLow = 'sandbox',
    GroundZeroHigh = 'sandbox_high',
    Shoreline = 'shoreline',
    Streets = 'tarkovstreets',
    Woods = 'woods',
}

export enum DisplayLocation {
    Customs = 'Customs',
    Factory = 'Factory',
    Interchange = 'Interchange',
    Labs = 'Labs',
    Lighthouse = 'Lighthouse',
    Reserve = 'Reserve',
    GroundZero = 'Ground Zero',
    Shoreline = 'Shoreline',
    Streets = 'Streets',
    Woods = 'Woods',
}

export function mapLocationToDisplayLocation(location: Location): DisplayLocation {
    switch (location) {
        case Location.Customs:
            return DisplayLocation.Customs;
        case Location.FactoryDay:
            return DisplayLocation.Factory;
        case Location.FactoryNight:
            return DisplayLocation.Factory;
        case Location.Interchange:
            return DisplayLocation.Interchange;
        case Location.Labs:
            return DisplayLocation.Labs;
        case Location.Lighthouse:
            return DisplayLocation.Lighthouse;
        case Location.Reserve:
            return DisplayLocation.Reserve;
        case Location.GroundZeroHigh:
            return DisplayLocation.GroundZero;
        case Location.GroundZeroLow:
            return DisplayLocation.GroundZero;
        case Location.Shoreline:
            return DisplayLocation.Shoreline;
        case Location.Streets:
            return DisplayLocation.Streets;
        case Location.Woods:
            return DisplayLocation.Woods;
    }
}

export function mapLocationToNiceUrlName(location: Location): string {
    switch (location) {
        case Location.Customs:
            return 'customs';
        case Location.FactoryDay:
            return 'factory';
        case Location.FactoryNight:
            return 'factory-night';
        case Location.Interchange:
            return 'interchange';
        case Location.Labs:
            return 'labs';
        case Location.Lighthouse:
            return 'lighthouse';
        case Location.Reserve:
            return 'reserve';
        case Location.GroundZeroLow:
            return 'ground-zero-low';
        case Location.GroundZeroHigh:
            return 'ground-zero-high';
        case Location.Shoreline:
            return 'shoreline';
        case Location.Streets:
            return 'streets';
        case Location.Woods:
            return 'woods';
    }
}
