import { signal } from '@preact/signals';
import { Translations } from '../model/translations';

const translations = signal<Translations>(new Map());

export const setTranslations = (newTranslations: Translations) => {
    translations.value = newTranslations;
};

export const requireTranslation = (itemId: string) => {
    const value = translations.value.get(itemId);
    if (!value) {
        throw new Error(`translation for item ${itemId} not found`);
    }
    return value;
};
