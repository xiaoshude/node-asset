import timelong from 'timelong';

export enum NodeEnv {
  test = 'test',
  dev = 'development',
  prod = 'production',
}

// Runner = 超过这个时间必然中断脚本执行，且报错，默认值。
export const RUNNER_TIMEOUT_MAX = timelong.ms1h;

// Master = 超过这个时间必然中断脚本执行，且报错，上限值。
export const MASTER_TIMEOUT_MAX_CEIL = RUNNER_TIMEOUT_MAX;
// Master = 如果这个时间没有输出，那么中断脚本执行，且报错
export const MASTER_TIMEOUT_PERIOD = timelong.ms20m;
// Master = 标准输出流和标准错误流混合后的最大buffer size
export const MASTER_INFO_MAX_BUFFER = 100 * 1024;

