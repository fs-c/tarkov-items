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

export function mapLocationToDisplayName(location: Location): string {
    switch (location) {
        case Location.Customs:
            return 'Customs';
        case Location.FactoryDay:
            return 'Factory';
        case Location.FactoryNight:
            return 'Factory (Night)';
        case Location.Interchange:
            return 'Interchange';
        case Location.Labs:
            return 'Labs';
        case Location.Lighthouse:
            return 'Lighthouse';
        case Location.Reserve:
            return 'Reserve';
        case Location.GroundZeroLow:
            return 'Ground Zero';
        case Location.GroundZeroHigh:
            return 'Ground Zero (High)';
        case Location.Shoreline:
            return 'Shoreline';
        case Location.Streets:
            return 'Streets';
        case Location.Woods:
            return 'Woods';
    }
}
