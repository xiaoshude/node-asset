# 如何使用

如果只需要写 controller，可以直接在 src/controller 目录下创建文件，如：

```js
import { AppContext } from "../typings";
export const post = async (ctx: AppContext) => {
  const { body } = ctx.request;

  if (!body) {
    ctx.throw(400, 'body is required');
  }


  ctx.logger.debug('bot', body);

  ctx.body = {
    retcode: 0,
    msg: 'success',
    data: {},
  };
}


```

如果需要自定义 controller 的路径，设置 env 变量 `CONTROLLER_PATH` 即可，如：

如果需要自定义 app.ts，copy 一份到项目中，然后再改即可

如果需要自定义 api 路径前缀，设置 env 变量 `HTTP_API_PREFIX` 即可
