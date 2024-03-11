import * as fs from 'node:fs'
import * as shelljs from 'shelljs'
import * as util from 'node:util'
import * as path from 'node:path'

const exec = util.promisify(shelljs.exec)
export async function ensureStubInstalled(stub: string, cwd?: string) {
  const workspacePath = cwd || process.cwd()
  const stubPath = path.resolve(workspacePath, `node_modules/${stub}`)
  // 判定是否安装，如果没安装，执行安装，否则啥也不做
  if (!fs.existsSync(stubPath)) {
    // 执行安装
    // await exec(`npm install ${stub} -D`);
    // 项目无需安装，这个安装相当于 .tolstoy 的作用，用户无需感知的文件
    // TODO: 把类型文件改写并移动到项目根目录；
    await exec(`npm install ${stub}`)
  }
}
