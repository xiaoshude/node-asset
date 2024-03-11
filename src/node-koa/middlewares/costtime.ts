import { Context, Next } from 'koa';
const acceptType = ['object', 'undefined'];
// 给请求响应，添加 cost，用于观察接口性能
export async function costime<T extends Context>(ctx: T, next: Next) {
  const start = Date.now();
  try {
    await next();
    const cost = Date.now() - start;
    // 只有在 ctx.body 是对象或这 undefined/ null才加 cost 属性
    if (acceptType.includes(typeof ctx.body)) {
      if (!ctx.body) {
        // eslint-disable-next-line no-param-reassign
        ctx.body = { cost };
        return;
      }
      // eslint-disable-next-line no-param-reassign
      (ctx.body as any).cost = cost;
    }
  } catch (e) {
    const cost = Date.now() - start;
    if (acceptType.includes(typeof ctx.body)) {
      if (!ctx.body) {
        // eslint-disable-next-line no-param-reassign
        ctx.body = { cost };
        throw e;
      }
      // eslint-disable-next-line no-param-reassign
      (ctx.body as any).cost = cost;
    }
    throw e;
  }
};

