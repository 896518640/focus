export type CurrentUserResponseData = ApiResponseData<{ 
  id: string; 
  username: string; 
  email: string;
  role: string;
  roles: string[]; 
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}>
