import { signal } from '@preact/signals';
import { Location, Translations } from '../model/loot-data';
import { ItemMetadata } from '../model/item-metadata';

export const translations = signal<Translations>(new Map());
export const averageSpawnsPerMap = signal<Map<Location, Map<string, number>>>(new Map());
export const allItemMetadata = signal<Map<ItemMetadata['id'], ItemMetadata>>(new Map());
