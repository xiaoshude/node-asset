import * as path from 'node:path'
import { Next, Context } from 'koa'
import { CONTROLLER_PATH, HTTP_API_PREFIX } from '../node-core/config/env'


export function getRouter() {
  return async (ctx: Context, next: Next) => {
    // get path and method
    const { path: httpPath, method } = ctx
    // if path prefix with /api, choose corisponding function from controller.ts
    if (httpPath.startsWith(HTTP_API_PREFIX)) {
      const pathWithoutPrefix = httpPath.replace(HTTP_API_PREFIX, '')
      const controllerFilePath = path.resolve(CONTROLLER_PATH, pathWithoutPrefix)
      // require 有 cache, 所有不用担心重复加载, 不要用 fs
      const controller = require(controllerFilePath)
      const controllerMethod = controller[method.toLowerCase()]
      if (!controllerMethod) {
        ctx.status = 404
        ctx.body = { message: 'no controller method' }
        return
      }

      // 不要 catch，外层有中间件统一处理
      await controllerMethod(ctx)
    }

    // TODO: some other path
  }
}
