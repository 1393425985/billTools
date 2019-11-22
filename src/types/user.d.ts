declare namespace IUser {
  export interface UserInfo {
    email: string;
    exp: number;
    iat: number;
    id: string;
    name: string;
    tel: string;
  }
  export interface Model {
    info: UserInfo;
    loginInfo: {
      status: boolean;
      msg: LoginRs['msg'];
    };
    collapsed: boolean;
    isOnline: boolean;
  }
  export interface TokenInfo {
    token: LoginRs['data']['token'];
    timer: UserInfo['exp'];
  }
  export interface LoginParam {
    tel: UserInfo['tel'];
    pwd: string;
    token?: LoginRs['data']['token'];
  }
  export type LoginRs = IG.RS<{
    info: UserInfo;
    token: string;
  }>;
}
