import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as protobuf from 'protobufjs';
import { MongoClient } from 'mongodb';

import path from 'path';
import {
  CreateUserRequest,
  CreateUserResponse,
  GetUserRequest,
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserRequest,
  DeleteUserResponse,
} from './types/user';


const PROTO_PATH = path.join(__dirname, '../protos/user.proto');

// Load protobuf
const root = protobuf.loadSync(PROTO_PATH);
const userService = root.lookupService('userService');

// MongoDB connection URL
const url = 'mongodb://localhost:27017';
const dbName = 'grpc_users';

async function main() {
  const client = await MongoClient.connect(url, {
    //@ts-ignore
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db(dbName);
  const usersCollection = db.collection('users');

  const server = new grpc.Server();
//@ts-ignore
  server.addService(userService, {
    createUser: async (
      call: grpc.ServerUnaryCall<CreateUserRequest, CreateUserResponse>,
      callback: grpc.sendUnaryData<CreateUserResponse>
    ) => {
      const { username, name, email, phone, password, age, id } = call.request;

      try {
        await usersCollection.insertOne({ username, name, email, phone, password, age, id });
        callback(null, { username, status: 'User created successfully' });
      } catch (error:any) {
        callback(error, null);
      }
    },

    getUser: async (
      call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
      callback: grpc.sendUnaryData<GetUserResponse>
    ) => {
      const { username, password } = call.request;

      try {
        const user = await usersCollection.findOne({ username, password });
        if (user) {
          callback(null, { username: user.username, status: 'User found' });
        } else {
          callback(null, { username: '', status: 'User not found' });
        }
      } catch (error:any) {
        callback(error, null);
      }
    },

    updateUser: async (
      call: grpc.ServerUnaryCall<UpdateUserRequest, UpdateUserResponse>,
      callback: grpc.sendUnaryData<UpdateUserResponse>
    ) => {
      const { username, password, newUser } = call.request;

      try {
        const result = await usersCollection.updateOne({ username, password }, { $set: { ...newUser } });
        if (result.modifiedCount > 0) {
          callback(null, { username: newUser.username, status: 'User updated successfully' });
        } else {
          callback(null, { username: '', status: 'User not found or update failed' });
        }
      } catch (error:any) {
        callback(error, null);
      }
    },

    deleteUser: async (
      call: grpc.ServerUnaryCall<DeleteUserRequest, DeleteUserResponse>,
      callback: grpc.sendUnaryData<DeleteUserResponse>
    ) => {
      const { username, password } = call.request;

      try {
        const result = await usersCollection.deleteOne({ username, password });
        if (result.deletedCount > 0) {
          callback(null, { username, status: 'User deleted successfully' });
        } else {
          callback(null, { username: '', status: 'User not found or delete failed' });
        }
      } catch (error:any) {
        callback(error, null);
      }
    },
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
}

main().catch(console.error);
