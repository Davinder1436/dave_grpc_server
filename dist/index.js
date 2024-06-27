"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const grpc = __importStar(require("@grpc/grpc-js"));
const protobuf = __importStar(require("protobufjs"));
const mongodb_1 = require("mongodb");
const path_1 = __importDefault(require("path"));
const PROTO_PATH = path_1.default.join(__dirname, '../protos/user.proto');
// Load protobuf
const root = protobuf.loadSync(PROTO_PATH);
const userService = root.lookupService('userService');
// MongoDB connection URL
const url = 'mongodb://localhost:27017';
const dbName = 'grpc_users';
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield mongodb_1.MongoClient.connect(url, {
            //@ts-ignore
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
        const server = new grpc.Server();
        //@ts-ignore
        server.addService(userService, {
            createUser: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                const { username, name, email, phone, password, age, id } = call.request;
                try {
                    yield usersCollection.insertOne({ username, name, email, phone, password, age, id });
                    callback(null, { username, status: 'User created successfully' });
                }
                catch (error) {
                    callback(error, null);
                }
            }),
            getUser: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                const { username, password } = call.request;
                try {
                    const user = yield usersCollection.findOne({ username, password });
                    if (user) {
                        callback(null, { username: user.username, status: 'User found' });
                    }
                    else {
                        callback(null, { username: '', status: 'User not found' });
                    }
                }
                catch (error) {
                    callback(error, null);
                }
            }),
            updateUser: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                const { username, password, newUser } = call.request;
                try {
                    const result = yield usersCollection.updateOne({ username, password }, { $set: Object.assign({}, newUser) });
                    if (result.modifiedCount > 0) {
                        callback(null, { username: newUser.username, status: 'User updated successfully' });
                    }
                    else {
                        callback(null, { username: '', status: 'User not found or update failed' });
                    }
                }
                catch (error) {
                    callback(error, null);
                }
            }),
            deleteUser: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                const { username, password } = call.request;
                try {
                    const result = yield usersCollection.deleteOne({ username, password });
                    if (result.deletedCount > 0) {
                        callback(null, { username, status: 'User deleted successfully' });
                    }
                    else {
                        callback(null, { username: '', status: 'User not found or delete failed' });
                    }
                }
                catch (error) {
                    callback(error, null);
                }
            }),
        });
        const port = '50051';
        server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
            if (error) {
                console.error(`Server binding error: ${error.message}`);
                return;
            }
            console.log(`Server running at http://0.0.0.0:${port}`);
            server.start();
        });
    });
}
main().catch(console.error);
