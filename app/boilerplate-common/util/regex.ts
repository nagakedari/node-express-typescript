// NOTE:  No global flags on these, they are for validation rather than matching in text
const ALPHANUMERIC_REGEX = /^[A-Z0-9]*$/i;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,64}$/i;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Z\d$@$!%*#?&]{4,64}$/i;
const TOKEN_REGEX = /^[A-Z0-9\-]*$/i;
const USERNAME_REGEX = /^[A-Z0-9._%+-@]{4,64}$/i;
const NORTH_AMERICAN_PHONE_REGEX: RegExp = /^[0-9]{3}[^0-9]*[0-9]{3}[^0-9]*[0-9]{4}$/i;

function validatePassword(password: string) {
  return PASSWORD_REGEX.test(password);
}

function validateUsername(username: string) {
  return USERNAME_REGEX.test(username);
}

function validateNorthAmericanPhoneNumber(phoneNumber: string) {
  return NORTH_AMERICAN_PHONE_REGEX.test(phoneNumber);
}

export {
  ALPHANUMERIC_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  TOKEN_REGEX,
  USERNAME_REGEX,
  validateUsername,
  validatePassword,
  validateNorthAmericanPhoneNumber
};


