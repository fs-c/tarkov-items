import { signal } from '@preact/signals';
import { Location, Translations } from '../model/loot-data';
import { ItemMetadata } from '../model/item-metadata';
import { StaticSpawns, ContainerContent } from '../model/loot-data';

export const translations = signal<Translations>(new Map());
export const staticSpawnsPerMap = signal<Map<Location, StaticSpawns>>(new Map());
export const containerContentPerMap = signal<Map<Location, ContainerContent>>(new Map());
export const allItemMetadata = signal<Map<ItemMetadata['id'], ItemMetadata>>(new Map());
