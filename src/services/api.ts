import request from '@utils/request';

export async function apiTransfer(
  search: string,
): Promise<{ translateResult: { src: string; tgt: string }[][] }> {
  return request(
    `http://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURI(
      search,
    )}`,
  );
}
