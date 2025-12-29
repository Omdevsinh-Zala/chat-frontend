export interface LoginModel {
  email: string;
  password: string;
}

export interface RegisterModel {
  firstName: string;
  lastName: string;
  username: string;
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
  active_chat_id: string;
}
