"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const databse_1 = __importDefault(require("../db/databse"));
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
const SECRET_KEY = "abcd1234";
// TODO signup with the wallet address
// TODO signing an address
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcodedAddress = "0x779c7FF70C424B0A494bF524Fd4a021833D8B5bd";
    try {
        // find the user
        const user = yield databse_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.address, hardcodedAddress)
        });
        let existingUser = user;
        // create one if not found
        if (!user) {
            const [newUser] = yield databse_1.default.insert(schema_1.users)
                .values({
                address: hardcodedAddress
            })
                .returning();
            existingUser = newUser;
        }
        if (!existingUser) {
            throw new Error("Failed to create or retrieve the user.");
        }
        // assign the token
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, SECRET_KEY);
        res.json(token);
    }
    catch (error) {
        console.error("Error during user sign-in:", error);
        res.status(500).json({ error: "Internal server error during sign-in" });
    }
}));
exports.default = router;
