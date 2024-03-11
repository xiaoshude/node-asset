export const omitRiskScan = async (ctx, next) => {
  const ua = ctx.header['user-agent'];
  if (!ua) {
    // 客户端没有ua，直接返回
    ctx.status = 403;
    return;
  }

  console.log('checkua', ua);
  if (ua.toLowerCase().includes('riskscan')) {
    console.log('riskscan');
    ctx.status = 200;
    return;
  }

  await next();
}
