import { createHash, pbkdf2 } from 'crypto';

export const md5byBuffer = (buf: Buffer) => {
  const result = createHash('md5').update(buf)
    .digest('hex');
  return result;
}

/**
 * 计算一个字符串的 md5
 * @param value 需要计算 md5 的字符串
 */
export const md5 = (value: string) => {
  const buffer = Buffer.from(value, 'utf-8');
  return md5byBuffer(buffer);
};



// 设定PBKDF2的参数
const iterations = 1000; // 迭代次数
const hashBytes = 64; // 生成哈希的字节数
const digest = 'sha256'; // 哈希函数
const salt = Buffer.from('dsdsdsdxxxxx', 'hex');
/**
 * 使用PBKDF2方法和固定盐值生成哈希，可用于生成加密 token
 * @param value - 要哈希的数据
 * @returns Promise<string> - 返回哈希字符串的Promise
 */
export const sha256 = (value: string) => {
  return new Promise((resolve, reject) => {
    pbkdf2(value, salt, iterations, hashBytes, digest, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        const hash = derivedKey.toString('hex');
        resolve(hash); // 直接返回哈希字符串
      }
    });
  });
}

