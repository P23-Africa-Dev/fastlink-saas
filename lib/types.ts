export interface UserRole {
  id: number;
  name: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  roles: UserRole[];
}

export interface LoginRequest {
  email: string;
  password: string;
  device_name: string;
}

export interface LoginResponseData {
  token: string;
  token_type: string;
  user: CurrentUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}
