import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import * as React from 'react';

import { arApp, ckbApp, enApp } from './strings-app';

export type Lang = 'en' | 'ar' | 'ckb';

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'ckb', label: 'کوردی', short: 'کو' },
];

const RTL_LANGS: Lang[] = ['ar', 'ckb'];

const enBase = {
  appTagline: 'Cars for rent near you',
  searchPlaceholder: 'Search brand, model or city',
  listingsCount: (n: number) => (n === 1 ? '1 car' : `${n} cars`),
  emptyTitle: 'No listings yet',
  emptyBody: 'Tap “Add listing” to post the first car.',
  noResults: 'No cars match your search.',
  addListing: 'Add listing',
  newListing: 'New listing',
  allOptional: 'Every field is optional. Fill in what you know.',
  untitled: 'Untitled car',
  perDay: '/ day',
  priceOnRequest: 'Price on request',
  available: 'Available',
  from: 'From',
  to: 'To',
  call: 'Call',
  sectionCar: 'Car',
  sectionRental: 'Rental terms',
  sectionPhotos: 'Photos & contact',
  title: 'Title',
  titlePh: 'e.g. Clean family SUV',
  brand: 'Brand',
  brandPh: 'Toyota',
  model: 'Model',
  modelPh: 'Land Cruiser',
  year: 'Year',
  yearPh: '2022',
  color: 'Color',
  colorPh: 'White',
  price: 'Price per day',
  pricePh: '50',
  currency: 'Currency',
  location: 'Location',
  locationPh: 'Erbil, Ankawa',
  availableFrom: 'Available from',
  availableTo: 'Available until',
  pickDate: 'Pick a date',
  clear: 'Clear',
  photos: 'Photos',
  addPhotos: 'Add photos',
  description: 'Description',
  descriptionPh: 'Condition, extras, rules…',
  phone: 'Phone',
  phonePh: '0750 123 4567',
  save: 'Save listing',
  cancel: 'Cancel',
  language: 'Language',
  justNow: 'New',
};

const en = { ...enBase, ...enApp };
export type Dict = typeof en;

const arBase: typeof enBase = {
  appTagline: 'سيارات للإيجار بالقرب منك',
  searchPlaceholder: 'ابحث عن الماركة أو الموديل أو المدينة',
  listingsCount: (n) => (n === 1 ? 'سيارة واحدة' : `${n} سيارات`),
  emptyTitle: 'لا توجد إعلانات بعد',
  emptyBody: 'اضغط على «إضافة إعلان» لنشر أول سيارة.',
  noResults: 'لا توجد سيارات تطابق بحثك.',
  addListing: 'إضافة إعلان',
  newListing: 'إعلان جديد',
  allOptional: 'جميع الحقول اختيارية. املأ ما تعرفه.',
  untitled: 'سيارة بدون عنوان',
  perDay: '/ يوم',
  priceOnRequest: 'السعر عند الطلب',
  available: 'متاحة',
  from: 'من',
  to: 'إلى',
  call: 'اتصال',
  sectionCar: 'السيارة',
  sectionRental: 'شروط الإيجار',
  sectionPhotos: 'الصور والتواصل',
  title: 'العنوان',
  titlePh: 'مثال: سيارة عائلية نظيفة',
  brand: 'الماركة',
  brandPh: 'تويوتا',
  model: 'الموديل',
  modelPh: 'لاند كروزر',
  year: 'سنة الصنع',
  yearPh: '2022',
  color: 'اللون',
  colorPh: 'أبيض',
  price: 'السعر لليوم',
  pricePh: '50',
  currency: 'العملة',
  location: 'الموقع',
  locationPh: 'أربيل، عنكاوا',
  availableFrom: 'متاحة من',
  availableTo: 'متاحة حتى',
  pickDate: 'اختر تاريخاً',
  clear: 'مسح',
  photos: 'الصور',
  addPhotos: 'إضافة صور',
  description: 'الوصف',
  descriptionPh: 'الحالة، الإضافات، الشروط…',
  phone: 'رقم الهاتف',
  phonePh: '0750 123 4567',
  save: 'حفظ الإعلان',
  cancel: 'إلغاء',
  language: 'اللغة',
  justNow: 'جديد',
};

const ckbBase: typeof enBase = {
  appTagline: 'ئۆتۆمبێلی بەکرێ لە نزیک تۆ',
  searchPlaceholder: 'گەڕان بە مارکە، مۆدێل یان شار',
  listingsCount: (n) => `${n} ئۆتۆمبێل`,
  emptyTitle: 'هێشتا هیچ ڕیکلامێک نییە',
  emptyBody: 'کرتە لە «زیادکردنی ڕیکلام» بکە بۆ بڵاوکردنەوەی یەکەم ئۆتۆمبێل.',
  noResults: 'هیچ ئۆتۆمبێلێک لەگەڵ گەڕانەکەت ناگونجێت.',
  addListing: 'زیادکردنی ڕیکلام',
  newListing: 'ڕیکلامی نوێ',
  allOptional: 'هەموو خانەکان ئارەزوومەندانەن. ئەوەی دەیزانیت پڕی بکەرەوە.',
  untitled: 'ئۆتۆمبێلی بێ ناونیشان',
  perDay: '/ ڕۆژ',
  priceOnRequest: 'نرخ بە داواکاری',
  available: 'بەردەستە',
  from: 'لە',
  to: 'بۆ',
  call: 'پەیوەندی',
  sectionCar: 'ئۆتۆمبێل',
  sectionRental: 'مەرجەکانی کرێ',
  sectionPhotos: 'وێنە و پەیوەندی',
  title: 'ناونیشان',
  titlePh: 'نموونە: ئۆتۆمبێلی خێزانی پاک',
  brand: 'مارکە',
  brandPh: 'تۆیۆتا',
  model: 'مۆدێل',
  modelPh: 'لاند کروزەر',
  year: 'ساڵ',
  yearPh: '2022',
  color: 'ڕەنگ',
  colorPh: 'سپی',
  price: 'نرخ بۆ هەر ڕۆژێک',
  pricePh: '50',
  currency: 'دراو',
  location: 'شوێن',
  locationPh: 'هەولێر، عەنکاوە',
  availableFrom: 'بەردەستە لە',
  availableTo: 'بەردەستە تا',
  pickDate: 'بەروارێک هەڵبژێرە',
  clear: 'سڕینەوە',
  photos: 'وێنەکان',
  addPhotos: 'زیادکردنی وێنە',
  description: 'وەسف',
  descriptionPh: 'دۆخ، زیادەکان، یاساکان…',
  phone: 'ژمارەی مۆبایل',
  phonePh: '0750 123 4567',
  save: 'پاشەکەوتکردن',
  cancel: 'پاشگەزبوونەوە',
  language: 'زمان',
  justNow: 'نوێ',
};

const ar: Dict = { ...arBase, ...arApp };
const ckb: Dict = { ...ckbBase, ...ckbApp };
const DICTS: Record<Lang, Dict> = { en, ar, ckb };
const STORAGE_KEY = 'rentobile.lang';
/** Key used before the app was renamed from BaKre; read once as a fallback. */
const LEGACY_STORAGE_KEY = 'bakre.lang';

function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  if (code === 'ar') return 'ar';
  if (code === 'ckb' || code === 'ku') return 'ckb';
  return 'en';
}

type I18n = {
  lang: Lang;
  t: Dict;
  isRTL: boolean;
  /** BCP-47 locale for Intl formatting. */
  locale: string;
  setLang: (lang: Lang) => void;
};

const I18nContext = React.createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(deviceLang);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => saved ?? AsyncStorage.getItem(LEGACY_STORAGE_KEY))
      .then((saved) => {
        if (saved === 'en' || saved === 'ar' || saved === 'ckb') setLangState(saved);
      })
      .catch(() => {});
  }, []);

  const value = React.useMemo<I18n>(
    () => ({
      lang,
      t: DICTS[lang],
      isRTL: RTL_LANGS.includes(lang),
      locale: lang === 'ckb' ? 'ckb-IQ' : lang === 'ar' ? 'ar-IQ' : 'en-US',
      setLang: (next) => {
        setLangState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      },
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
