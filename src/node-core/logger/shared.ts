// 优先从环境变量取，适应单仓库多入口
// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require(`${process.cwd()}/package.json`);
const project = process.env.PROJECT;
export const projectName = project || packageJson.name;

