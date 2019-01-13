import {PhoneNumberFormat, PhoneNumberUtil, PhoneNumber} from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

// TODO: Low Priority (i18n) Replace with package like i18n-iso-contries to go international

const CountryCodes = [
  'US'
];

interface Localization {
  countryCode: string;
}

function i18nValidatePhoneNumber(localization: Localization, phoneNumber: string): boolean {
  if (!localization || !phoneNumber) {
    return false;
  }
  try {
    const number: PhoneNumber = phoneUtil.parse(phoneNumber, localization.countryCode);
    return phoneUtil.isValidNumberForRegion(number, localization.countryCode);
  } catch (err) {
    console.warn('i18n validation (ignore): ' + err.message);
    return false;
  }
}

function i18nFormatPhoneNumber(localization: Localization, phoneNumber: string) {
  if (!localization || !phoneNumber) {
    return '';
  }
  const number: PhoneNumber = phoneUtil.parse(phoneNumber, localization.countryCode);
  return phoneUtil.format(number, PhoneNumberFormat.NATIONAL);
}

export {
  CountryCodes,
  Localization,
  i18nValidatePhoneNumber,
  i18nFormatPhoneNumber
};

