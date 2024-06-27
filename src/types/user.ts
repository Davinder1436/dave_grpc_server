export interface CreateUserRequest {
    username: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    age: number;
    id: string;
  }
  
  export interface CreateUserResponse {
    username: string;
    status: string;
  }
  
  export interface GetUserRequest {
    username: string;
    password: string;
  }
  
  export interface GetUserResponse {
    username: string;
    status: string;
  }
  
  export interface UpdateUserRequest {
    username: string;
    password: string;
    newUser: CreateUserRequest;
  }
  
  export interface UpdateUserResponse {
    username: string;
    status: string;
  }
  
  export interface DeleteUserRequest {
    username: string;
    password: string;
  }
  
  export interface DeleteUserResponse {
    username: string;
    status: string;
  }
  