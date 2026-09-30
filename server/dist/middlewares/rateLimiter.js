"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRateLimiter = exports.chatRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.chatRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 chat requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit of 30 queries per minute. Please try again shortly.',
    },
});
exports.uploadRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 uploads per 5 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too Many Requests',
        message: 'Upload rate limit reached. Please wait a few moments before uploading more files.',
    },
});
