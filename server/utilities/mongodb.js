"use strict";
// =============================================================================
// Database Utilities
// (c) Kha-Boom!
// =============================================================================
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
exports.isMongoID = isMongoID;
exports.connectMongo = connectMongo;
exports.getMongoStore = getMongoStore;
const mongoose_1 = require("mongoose");
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const utilities_1 = require("./utilities");
function isMongoID(str) {
    if (!str)
        return false;
    return mongoose_1.Types.ObjectId.isValid(str);
}
function connectMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            try {
                const url = utilities_1.CONFIG.accounts.mongoServer || 'mongodb://localhost:27017/tmp';
                yield (0, mongoose_1.connect)(url);
                return mongoose_1.connection.getClient();
            }
            catch (_a) {
                if (utilities_1.IS_PROD)
                    throw new Error();
                console.log('Trying in-memory Mongo DB...');
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { MongoMemoryReplSet } = require('mongodb-memory-server');
                const mongo = yield MongoMemoryReplSet.create();
                yield (0, mongoose_1.connect)(mongo.getUri());
                return mongoose_1.connection.getClient();
            }
        }
        catch (_b) {
            console.error('Failed to connect to MongoDB!');
            process.exit(1);
        }
    });
}
function getMongoStore() {
    const clientPromise = connectMongo(); // async
    return connect_mongo_1.default.create({ clientPromise, touchAfter: 12 * 3600 });
}
