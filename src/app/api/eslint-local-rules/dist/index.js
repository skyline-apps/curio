"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_middleware_1 = require("./api-middleware");
module.exports = {
    rules: {
        "api-middleware": api_middleware_1.apiMiddlewareRule,
        "response-parse": api_middleware_1.responseParseRule,
        "api-validation": api_middleware_1.apiValidationRule,
    },
};
