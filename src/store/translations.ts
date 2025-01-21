import { signal } from '@preact/signals';
import { Translations } from '../model/translations';

const translations = signal<Translations>(new Map());
