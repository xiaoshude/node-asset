import crypto from 'crypto';

/**
 * 提供基于PKCS7算法的加解密接口
 *
 */
class PKCS7Encoder {
  /**
  * 删除解密后明文的补位字符
  *
  * @param {String} text 需要进行填充补位操作的明文
  */

  static decode(text: any) {
    let pad = text[text.length - 1];
    if (pad < 1 || pad > 32) {
      pad = 0;
    }

    return text.slice(0, text.length - pad);
  }

  /**
  * 对需要加密的明文进行填充补位
  *
  * @param {String} text 需要进行填充补位操作的明文
  */

  encode(text: any) {
    const blockSize = 32;
    const textLength = text.length;
    const amountToPad = blockSize - (textLength % blockSize); // 计算需要填充的位数
    const result = Buffer.alloc(amountToPad);
    result.fill(amountToPad);
    return Buffer.concat([text, result]);
  }
}

/**
* 微信企业平台加解密信息构造函数
*
* @param {String} token          公众平台上，开发者设置的Token
* @param {String} encodingAESKey 公众平台上，开发者设置的EncodingAESKey  用于消息体的加密，长度固定为43个字符，从a-z, A-Z, 0-9共62个字符中选取，是AESKey的Base64编码。解码后即为32字节长的AESKey
* @param {String} id         企业号的CorpId或者AppId
*/
export class WXBizMsgCrypt {
  public token: any;
  public iv: any;
  public key: any;
  public id: any;
  public constructor(token: string, encodingAESKey: string) {
    if (!token || !encodingAESKey) {
      throw new Error('please check arguments');
    }

    const encodingAESKeyP = encodingAESKey.concat('='); // EncodingAESKey + "="
    const AESKey = Buffer.from(encodingAESKeyP, 'base64'); // AES算法的密钥，长度为32字节。
    if (AESKey.length !== 32) {
      throw new Error('encodingAESKey invalid');
    }

    this.token = token;
    this.key = AESKey;
    this.iv = AESKey.slice(0, 16);
  }

  /**
  * 获取签名
  *
  * @param {String} timestamp    时间戳
  * @param {String} nonce        随机数
  * @param {String} encrypt      加密后的文本
  */
  getSignature(timestamp: string, nonce: string, encrypt: string) {
    const shasum = crypto.createHash('sha1');
    const arr = [this.token, timestamp, nonce, encrypt].sort(); // 校验签名  token、timestamp、nonce、msg_encrypt 这四个参数按照字典序排序 从小到大拼接成一个字符串
    shasum.update(arr.join(''));
    return shasum.digest('hex');
  }

  /**
  * 对密文进行解密
  *
  * @param {String} text 待解密的密文
  */
  decrypt(text: any) {
    // 创建解密对象，AES采用CBC模式，数据采用PKCS#7填充；IV初始向量大小为16字节，取AESKey前16字节
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
    decipher.setAutoPadding(false);
    let deciphered = Buffer.concat([decipher.update(text, 'base64'), decipher.final()]);
    deciphered = PKCS7Encoder.decode(deciphered);
    // 算法：AES_Encrypt[random(16B) + msg_len(4B) + msg + $CorpID]
    // 去除16位随机数
    const content = deciphered.slice(16);
    const length = content.slice(0, 4).readUInt32BE(0);
    this.id = content.slice(length + 4).toString(); // 获取id,在加密算法中使用
    return content.slice(4, length + 4).toString();
  }

  /**
  * 对明文进行加密
  *
  * @param {String} text 待加密的明文
  */
  encrypt(text: any) {
    // 算法：AES_Encrypt[random(16B) + msg_len(4B) + msg + $CorpID]
    const randomString = crypto.pseudoRandomBytes(16); // 获取16B的随机字符串
    const msg = Buffer.from(text); // 明文
    const msgLength = Buffer.alloc(4); // 4个字节的msg长度
    msgLength.writeUInt32BE(msg.length, 0);
    const id = Buffer.from(this.id);
    const bufMsg = Buffer.concat([randomString, msgLength, msg, id]);
    // 对明文进行补位操作
    const pkcs7Encoder = new PKCS7Encoder();
    const encoded = pkcs7Encoder.encode(bufMsg);
    // 创建加密对象，AES采用CBC模式，数据采用PKCS#7填充；IV初始向量大小为16字节，取AESKey前16字节
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
    cipher.setAutoPadding(false);
    const cipheredMsg = Buffer.concat([cipher.update(encoded), cipher.final()]);
    // 返回加密数据的base64编码
    return cipheredMsg.toString('base64');
  }
}
