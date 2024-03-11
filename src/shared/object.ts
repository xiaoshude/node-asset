/**
 * 解决 json 无法序列化 bigint 的问题
 *
 * ref：https://github.com/GoogleChromeLabs/jsbi/issues/30
 *
 * @export
 * @returns
 */
export function toObject(obj: any) {
  return JSON.parse(JSON.stringify(obj, (key, value) => (typeof value === 'bigint'
    ? value.toString()
    : value), // return everything else unchanged
    // eslint-disable-next-line function-paren-newline
  ));
}

/**
 * 安全的 stringify 一个对象，尤其在上报日志的时候，防止因为成环的对象导致报错
 *safely handles circular references
 ref: https://stackoverflow.com/questions/11616630/how-can-i-print-a-circular-structure-in-a-json-like-format

 同时兼容 bigint
 * @param obj
 * @param indent
 * @returns
 */
export const safeStringify = (obj: any, indent = 2) => {
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

// 发现上面版本的效率很低，日志使用下面的 最好
export const safeStringifyForLog = (obj: any) => {
  try {
    const retVal = safeStringify(obj);
    return retVal;
  } catch (e) {
    console.error('safeStringifyForLog', e);
  }
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
