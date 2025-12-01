export interface LoginModel {
  email: string;
  password: string;
}

export interface GlobalResponse<T = any> {
  message: string;
  data?: T;
  statusCode: number;
  success: boolean;
}
