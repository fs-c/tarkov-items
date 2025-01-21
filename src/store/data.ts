import { signal } from '@preact/signals';
import { ItemMetadata } from '../model/item-metadata';
import { StaticSpawns, ContainerContent } from '../model/container-data';
import { MapMetadataCollection } from '../model/map-metadata';
import { DisplayLocation, Location } from '../model/location';
import { Translations } from '../model/translations';
import { LooseLoot } from '../model/loose-loot';

export const translations = signal<Translations>(new Map());
export const staticSpawnsPerMap = signal<Map<Location, StaticSpawns>>(new Map());
export const containerContentPerMap = signal<Map<Location, ContainerContent>>(new Map());
export const allItemMetadata = signal<Map<ItemMetadata['id'], ItemMetadata>>(new Map());
export const looseLootPerMap = signal<Map<Location, LooseLoot>>(new Map());
export const allMapMetadata = signal<Map<DisplayLocation, MapMetadataCollection>>(new Map());
