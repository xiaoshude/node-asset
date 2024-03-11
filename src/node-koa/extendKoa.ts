// @ts-ignore
import { Logger } from 'log4js';

/**
 *
 * 这里保留 node common 内，扩展的 koa context 属性
 * @export
 * @interface CommonContext
 */
export interface CommonContext {
    logger: Logger
    authInfo: Record<string, string>
}
