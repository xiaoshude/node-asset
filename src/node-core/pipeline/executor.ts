import * as style from 'ansi-styles';
import { ChildProcess, spawn } from 'child_process';
import dayjs from 'dayjs';
import * as fs from 'fs';
import { address } from 'ip';
import { mapValues } from 'lodash';
import * as mkdirp from 'mkdirp';
import * as rimraf from 'rimraf';
import { promisify } from 'util';

import {
  MASTER_INFO_MAX_BUFFER,
  MASTER_TIMEOUT_MAX_CEIL,
  MASTER_TIMEOUT_PERIOD,
} from '../config/const';
import { IShellError } from '../typings';
import { Recorder } from './recorder';

const mkdirpAsync = promisify(mkdirp);
const rimrafAsync = promisify(rimraf);
const readFileAsync = promisify(fs.readFile);
const fsStatAsync = promisify(fs.stat);
const fsWriteFileAsync = promisify(fs.writeFile);
const fsExistsFileAsync = promisify(fs.exists);

export interface ILocalShellOptions {
  cwd?: string;
  input?: string;
  env?: NodeJS.ProcessEnv;
}

export interface IShellRes {
  code: number;
  message: string;
  info: string;
  stderr: string;
  stdout: string;
  result?: Record<string, string>;
}

interface ITask extends ChildProcess {
  response: IShellRes;
  maxTid?: NodeJS.Timeout;
  tid?: NodeJS.Timeout;
}

/**
 * 用 excutor 开子进程执行，可以解决并发问题
 * 使用示例：
      await Executor.exec(`git fetch origin ${branch}`, { cwd: gitProjectDir });
      const diffResult = await Executor.exec(`git diff ${branch} origin/${branch} --name-only`, { cwd: gitProjectDir });
 */
export class Executor {
  static async mkDir(dir: string) {
    await mkdirpAsync(dir);
  }
  static async rmDir(dir: string) {
    await rimrafAsync(dir);
  }

  static async readFile(path: string, sizeLimit = 0, encoding?: string) {
    if (sizeLimit > 0) {
      const { size } = await fsStatAsync(path);
      if (size > sizeLimit) {
        throw new Error(`file ${path} size: ${size} is exceeds limit ${sizeLimit}`);
      }
    }

    return readFileAsync(path, encoding as any);
  }

  static async writeFile(path: string, content: string) {
    return fsWriteFileAsync(path, content);
  }

  static async existsFile(path: string) {
    return fsExistsFileAsync(path);
  }

  static async exec(command: string, options: ILocalShellOptions & {
    onStart?: (shell: string) => void;
    onEnd?: (res: IShellRes) => void;
    onError?: (err: IShellError) => void;
  } = {}): Promise<IShellRes> {
    const { cwd, input, env = {} } = options;

    const killSignalStr = 'SIGKILL';
    const killSignal = 9;

    return new Promise((resolve, reject) => {
      if (options.onStart) options.onStart(command);

      // for utf8 output
      const realShell = process.platform === 'win32' ? `cmd /c chcp 65001>nul && ${command}` : command;

      const task: ITask = Object.assign(spawn(realShell, {
        cwd,
        env: {
          ...{
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            MAIL: process.env.MAIL,
            PWD: process.env.PWD,
            LS_COLORS: process.env.LS_COLORS,
            _: process.env._,
          },
          ...env,
        },
        shell: true,
      }), {
        response: {
          code: 0,
          message: '成功',
          // 把标准输出流和标准错误流按照时间先后混合出来的buffer
          info: '',
          stderr: '',
          stdout: '',
        },
      });

      task.maxTid = setTimeout(() => {
        task.kill(killSignalStr);

        task.response.code = killSignal;
        task.response.message = `shell脚本因执行超过最大超时时间(${MASTER_TIMEOUT_MAX_CEIL}ms)而被强制关闭`;
      }, MASTER_TIMEOUT_MAX_CEIL) as any;

      const updatePeriod = () => {
        if (task.tid) {
          clearTimeout(task.tid);
        }

        task.tid = setTimeout(() => {
          task.kill(killSignalStr);

          task.response.code = killSignal;
          task.response.message = `shell脚本因执行超过(${MASTER_TIMEOUT_PERIOD}ms)没有任何输出而被强制关闭`;
        }, MASTER_TIMEOUT_PERIOD) as any;
      };

      updatePeriod();

      const streamData = (data: string, type: 'stdout' | 'stderr') => {
        const validBuffer = (buffer: string) => {
          if (Buffer.from(buffer).length > MASTER_INFO_MAX_BUFFER) {
            return false;
          }

          return true;
        };

        task.response.info += data;
        task.response[type] += data;
        updatePeriod();

        if (!validBuffer(task.response.info)) {
          // 超长做截断处理
          const buf = Buffer.from(task.response.info);
          task.response.info = buf.slice(buf.length - MASTER_INFO_MAX_BUFFER).toString();
        }
      };

      task.stdout?.on('data', (data) => {
        streamData(data, 'stdout');
      });

      task.stderr?.on('data', (data) => {
        streamData(data, 'stderr');
      });

      task.once('error', (err) => {
        const error: IShellError = new Error(err.message);
        error.code = -2;
        error.stdout = err.stack;
        error.stderr = err.stack;
        error.info = '';

        options.onError?.(error);
        reject(error);
      });

      task.once('close', (code, signal) => {
        if (options.onEnd) options.onEnd(task.response);

        if (task.maxTid) clearTimeout(task.maxTid);
        if (task.tid) clearTimeout(task.tid);

        if (signal === killSignalStr) {
          const error: IShellError = new Error(task.response.message);
          error.code = killSignal;
          error.stdout = task.response.stdout;
          error.stderr = task.response.stderr;
          error.info = task.response.info;
          options.onError?.(error);
          reject(error);
          return;
        }

        if (code === 0) {
          resolve(task.response);
        } else {
          task.response.code = code as any;
          task.response.message = `任务 "${command}" 执行失败，返回码：${code}`;

          const error: IShellError = new Error(task.response.message);
          error.code = code as any;
          error.stdout = task.response.stdout;
          error.stderr = task.response.stderr;
          error.info = task.response.info;
          options.onError?.(error);
          reject(error);
        }
      });

      if (typeof input === 'string') {
        task.stdin?.write(input);
        task.stdin?.end();
      }
    });
  }

  static encode(str: string) {
    return str.replace(/([\\'"$`\s])/g, '\\$1');
  }
  private recorder: Recorder;
  private internalEnv: NodeJS.ProcessEnv;
  private ip: string;

  constructor(options: {
    recorder: Recorder;
    internalEnv: Record<string, string>;
  }) {
    this.recorder = options.recorder;
    this.internalEnv = mapValues(options.internalEnv, value => String(value));
    this.ip = address();
  }

  /**
   * 本地执行一个shell脚本
   * @param {String} shell - shell脚本
   * @param {Object} options - options to exec shell
   * @param {String} options.cwd - 执行脚本时的工作空间
   * @param {String} options.input - 执行脚本之后的输入选项，会跟在shell脚本后面进入输入流
   */
  public async exec(shell: string, options: ILocalShellOptions = {}) {
    const { recorder, internalEnv } = this;
    const { cwd, input, env = {} } = options;
    const startTimestamp = Date.now();

    return Executor.exec(shell, {
      cwd,
      input,
      env: { ...process.env, ...env, ...internalEnv },
      onStart: (script) => {
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const prefix = `Master[${this.ip}] ${timestamp} $`;

        recorder.log(`${style.yellow.open}${prefix}${style.reset.close} ${script}`);
      },
      onEnd: (response) => {
        recorder.log(response.info);
        recorder.log(`Done ${Date.now() - startTimestamp}ms`);
      },
    });
  }


  public async rmDir(dir: string) {
    const { recorder } = this;
    const startTimestamp = Date.now();
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const prefix = `Master[${this.ip}] ${timestamp} $`;

    recorder.log(`${style.yellow.open}${prefix}${style.reset.close} rmdir -rf ${dir}`);
    await Executor.rmDir(dir);
    recorder.log(`Done ${Date.now() - startTimestamp}ms`);
  }
}
