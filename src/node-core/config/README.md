如何使用：
项目中应该建一个自己的 config 文件夹，同时一个 const.ts 和 env.ts 文件，分别用于存放常量和环境变量。

env.ts 文件，首先 import 这里的 env.ts，然后在添加自己的

默认 .env 读取路径 process.cwd() + '/.env'，可通过 process.env.DOTENV_PATH 设置
