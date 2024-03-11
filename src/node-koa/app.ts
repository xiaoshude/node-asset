import Koa from 'koa'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { getRouter } from './router'
import { ICustomAppState, ICustomAppContext, AppContext } from './typings';
import { getAddUid } from './middlewares/addUid'
import { costime } from './middlewares/costtime'
import { PORT, isProd } from '../node-core/config/env'
import { getLogger, logger } from '../node-core/logger';
import { newRandomIdGenerator } from '../shared/log';
import { safeStringify } from '../shared/object';
import { AError } from '../shared/AError';
const app = new Koa<ICustomAppState, ICustomAppContext>();

// 处理cors
app.use(cors({
  // allow any current origin
  origin: (ctx: Koa.Context) => {
    return ctx.headers.origin || '*'
  },
}))
app.use(bodyParser({
  onerror: (err, ctx) => {
    console.error('body parse error', err);
    ctx.throw('body parse error', 422);
  }
}))

// 如果测试环境，添加环境标识
if (!isProd) {
  app.use(async (ctx, next) => {
    await next();
    if (ctx.body) {
      ctx.body = {
        ...ctx.body,
        trace: ctx.state.trace,
      };
    }
  });
}
app.on('error', (err, ctx) => {
  console.log('app on error', err);
})

// 支持 http 健康检查
app.use(async (ctx, next) => {
  // / is for health check(k8s or clb)
  if (ctx.request.url === '/health_check' || ctx.request.url === '/') {
    // eslint-disable-next-line no-param-reassign
    ctx.status = 200;
    return;
  }

  await next();
});

// error handler
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err: any) {
    ctx.status = 500
    ctx.body = {
      data: err,
      message: err.message,
    }
    ctx.app.emit('error', err, ctx)
  }
})


app.use(async (ctx: AppContext, next) => {
  // eslint-disable-next-line no-param-reassign
  if (!ctx.logger) ctx.logger = getLogger();
  // 添加 trace id
  // 废弃 uuidv4， 使用符合 open trace 规范的traceid
  const traceId = ctx.get('X-Request-Id') || newRandomIdGenerator.generateTraceId();
  // eslint-disable-next-line no-param-reassign
  ctx.state.trace = traceId;
  ctx.logger.addContext('trace', traceId);
  // 新增：请求路径
  ctx.logger.addContext('path', ctx.request.path);

  ctx.state.timings?.startSpan('process http request');
  await next();
  ctx.state.timings?.stopSpan('process http request');
});

// 附加 uid 机器人推消息 必须要求 uid
const addUid = getAddUid<AppContext>((ctx) => {
  const uin = ctx.cookies.get('staffname') || ctx.cookies.get('uin') || ctx.cookies.get('p_uin');
  return uin || 'anonymous';
});
app.use(addUid);



app.use(async (ctx, next) => {
  ctx.logger.debug('接收到请求：', ctx.path, safeStringify(ctx.query), safeStringify(ctx.request.body), ctx.header.cookie);
  try {
    // console.log('domain', process.domain.ctx);
    await next();
  } catch (e) {
    ctx.logger.error('响应出错', e);
    if (e instanceof AError && e.code) {
      const { code } = e;
      // eslint-disable-next-line no-param-reassign
      ctx.body = {
        retcode: code,
        msg: e.message,
        data: {},
      };
      return;
    }

    // eslint-disable-next-line no-param-reassign
    ctx.body = {
      retcode: 5000,
      msg: 'unknow server error',
      data: {},
    };
    ctx.logger.fatal('[SEVERE!!!]未捕获异常', e);
  }
  // 新增：添加耗时，以便统计
  ctx.logger.addContext('cost', ctx.body?.cost);

  // 有的 body 实在太大，prod 去掉 log
  if (isProd) {
    ctx.logger.debug('响应请求', ctx.body?.cost);
  } else {
    ctx.logger.debug('响应请求', ctx.body);
  }
  // 超过 2s 告警
  // if (ctx.body?.cost && ctx.body.cost > 2000) {
  // !!! 写 error 的 log，一定要特别注意，不能写每次请求都不同的 message，一个例子：包含 costtime
  // ctx.logger.error(`[${ctx.path}]：耗时超 2000ms 告警`);
  // }
  // 存在且不为0
  // if (ctx.body?.retcode) {
  //   ctx.logger.error('[注意]：非 0 retcode 告警', {
  //     retcode: ctx.body?.retcode,
  //     message: ctx.body?.message,
  //   });
  // }
});

app.use(costime);
app.use(getRouter())
app.listen(PORT);

logger.log(`server start at: http://localhost:${PORT}`)
