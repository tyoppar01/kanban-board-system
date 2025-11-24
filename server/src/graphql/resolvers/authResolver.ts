import { AuthService } from "../../services/authService";
import { ClassName, MethodName, logProcess, logResponse } from "../../utils/loggerResponse";

interface UserInput {
  username: string;
  password: string;
  token?: string;
}

const service: AuthService = AuthService.getInstance();

export const authResolver = {

  Query: {
  },

  Mutation: {

    login: async (_: any, {userProfile}: { userProfile: UserInput }) => {

      logProcess(MethodName.LOGIN, ClassName.RESOLVE, { username: userProfile.username, hasToken: !!userProfile.token });
      // authenticate user login with optional token from frontend
      const res = await service.authenticateUser(userProfile);
      logResponse(MethodName.LOGIN, res);
      return res;
    },

    register: async (_: any, {userProfile}: { userProfile: UserInput }) => {

      logProcess(MethodName.REGISTER, ClassName.RESOLVE, { username: userProfile.username });
      // register new user
      const res = await service.registerUser(userProfile);
      logResponse(MethodName.REGISTER, res);
      return res;
    },



    
  },
};