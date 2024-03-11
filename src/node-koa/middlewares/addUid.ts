import { Context, Next } from 'koa';
const noop = () => '';
export const getAddUid = <T  extends Context>(fn: (ctx: T) => string = noop) => async (ctx: T, next: Next) => {
  // 首先默认 oa 的方式，从 request 取，否则从传入的 fn 取
  // eslint-disable-next-line no-param-reassign
  ctx.state.username = (ctx.request as any)?.user?.name as string ?? fn(ctx);
  ctx.logger.addContext('uid', ctx.state.username);
  await next();
};

