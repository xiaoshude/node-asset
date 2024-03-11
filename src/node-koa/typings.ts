import { ParameterizedContext } from 'koa';
import { CommonContext } from './extendKoa';
import { prisma } from '../node-core/storage/prisma';
export interface ICustomAppContext extends CommonContext {
  trace: string;
  prisma: typeof prisma
  close(callback?: (err?: Error) => void): Promise<void>;
}

export interface ICustomAppState {
  // 这里添加传递的 state 类型
  trace: string;
  projectName: string;
  timings: {
    startSpan: (desc: string) => void
    stopSpan: (desc: string) => void
  }
}


/**
 * 当给与中间件 ctx 类型时，就是这个类型
 * @export
 * @interface AppContext
 * @extends {ParameterizedContext<ICustomAppState, ICustomAppContext>}
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppContext extends ParameterizedContext<ICustomAppState, ICustomAppContext> { }
