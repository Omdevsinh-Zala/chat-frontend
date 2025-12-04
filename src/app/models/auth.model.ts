export interface LoginModel {
  email: string;
  password: string;
}

export interface RegisterModel {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface GlobalResponse<T = any> {
  message: string;
  data?: T;
  statusCode: number;
  success: boolean;
}

export interface PrivateKeyResponse {
  privateKey: string;
}
