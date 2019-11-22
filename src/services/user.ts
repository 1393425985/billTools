import request from '@utils/request';

export async function login({
  tel,
  pwd,
  token,
}: IUser.LoginParam): Promise<IUser.LoginRs> {
  let body;
  if (token) {
    body = {
      token,
    };
  } else {
    body = {
      tel,
      pwd,
    };
  }
  return request(`/api/user/login`, {
    method: 'POST',
    body,
  });
}

export async function getConfigCatch(): Promise<ICache.config> {
  return request(`/api/cacheData/get/config`, {
    method: 'GET',
  });
}
export async function updateConfigCatch(
  data: Partial<ICache.model>,
): Promise<ICache.config> {
  return request(`/api/cacheData/update`, {
    method: 'POST',
    body: {
      type: 'config',
      data,
    },
  });
}
export async function logout(code) {
  return request(`/api/${code}`);
}
