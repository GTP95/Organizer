import i18next from 'i18next';
import * as enCommon from './locales/en/common.json';
import * as itCommon from './locales/it/common.json';

export const defaultNS = 'common'; // Default name space

i18next.init({
	lng: 'en', // Default language
	fallbackLng: 'en', // Fallback language
	debug: true, // Enable debug mode (optional)
	resources: {
		en: {
			common: enCommon,
		},
		it: {
			common: itCommon,
		},
	},
});

export default i18next;
