/**
 * 将多行字符串按行分割为数组
 * @param string 需要进行分割的原始字符串
 */
export const splitLines = (string: string) => string.split(/(?:\r\n|\r|\n)/);
