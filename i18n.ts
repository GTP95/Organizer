import i18next from 'i18next';
import * as arCommon from './locales/ar/common.json';
import * as deCommon from './locales/de/common.json';
import * as enCommon from './locales/en/common.json';
import * as esCommon from './locales/es/common.json';
import * as frCommon from './locales/fr/common.json';
import * as hiCommon from './locales/hi/common.json';
import * as itCommon from './locales/it/common.json';
import * as nlCommon from './locales/nl/common.json';
import * as ptCommon from './locales/pt/common.json';
import * as zhCommon from './locales/zh/common.json';
import * as zhTWCommon from './locales/zh-TW/common.json';




export const defaultNS = 'common'; // Default name space

i18next.init({
	lng: 'en', // Default language
	fallbackLng: 'en', // Fallback language
	debug: true, // Enable debug mode (optional)
	resources: {
		ar: {
			common: arCommon,
		},
		de: {
			common: deCommon,
		},
		en: {
			common: enCommon,
		},
		es: {
			common: esCommon,
		},
		fr: {
			common: frCommon,
		},
		hi: {
			common: hiCommon,
		},
		it: {
			common: itCommon,
		},
		nl: {
			common: nlCommon,
		},
		pt: {
			common: ptCommon,
		},
		zh: {
			common: zhCommon,
		},
		zhTW: {
			common: zhTWCommon,
		}
	},
});

export default i18next;
