"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
const imageValidate = zod_1.default.object({
    options: zod_1.default.array(zod_1.default.object({
        imageurl: zod_1.default.string()
    })),
    title: zod_1.default.string().optional(),
    signature: zod_1.default.string()
});
exports.default = imageValidate;
