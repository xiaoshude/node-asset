import { camelCase } from 'lodash';

/**
 * 安全的 stringify 一个对象，尤其在上报日志的时候，防止因为成环的对象导致报错
 *safely handles circular references
 ref: https://stackoverflow.com/questions/11616630/how-can-i-print-a-circular-structure-in-a-json-like-format

 同时兼容 bigint
 * @param obj
 * @param indent
 * @returns
 */
export const safeStringify = (obj: Record<string, any>, indent = 2) => {
  const cache: any[] = [];
  const retVal = JSON.stringify(
    obj,
    // eslint-disable-next-line no-nested-ternary
    (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }

      if (typeof value === 'object' && value !== null) {
        if (cache.includes(value)) return undefined;
        cache.push(value);
      }

      return value;
    },
    indent,
  );
  return retVal;
};


/**
 * 去除一个对象中的空（null/undefined) key
 * @export
 * @param {Record<string, any>} obj
 * @returns {Record<string, any>}
 */
export function compactObject(obj: Record<string, any>): Record<string, any> {
  const param: Record<string, any> = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if ((obj[key] || obj[key] === 0) && obj.hasOwnProperty(key)) {
      param[key] = obj[key];
    }
  }
  return param;
}


export function camelcaseKeysDeep(obj: Record<string, any>): Record<string, any> {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelcaseKeysDeep(v));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [camelCase(key)]: camelcaseKeysDeep(obj[key]),
      }),
      {},
    );
  }
  return obj;
} 
