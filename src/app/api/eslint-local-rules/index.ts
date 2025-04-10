import {
  apiMiddlewareRule,
  apiValidationRule,
  responseParseRule,
} from "./api-middleware";

module.exports = {
  rules: {
    "api-middleware": apiMiddlewareRule,
    "response-parse": responseParseRule,
    "api-validation": apiValidationRule,
  },
};
