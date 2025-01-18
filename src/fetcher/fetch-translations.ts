import { Translations } from '../model/translations';

/**
 * Paths in this file are RELATIVE TO THE CURRENT PAGE (i.e. whatever the current path is when the
 * function is called). This is a quick workaround to make github pages work.
 */

export async function fetchTranslations(): Promise<Translations> {
    const response = await fetch('./database/translations.json');
    const rawTranslations = await (response.json() as Promise<Record<string, string>>);

    const translations = new Map<string, string>();

    for (const [key, value] of Object.entries(rawTranslations)) {
        const [tpl, type] = key.split(' ');

        if (type === 'ShortName') {
            translations.set(tpl, value);
        }
    }

    return translations;
}
