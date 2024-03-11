import * as fs from 'node:fs';
import * as path from 'path';

export const ensureDirectory = (filePathOrDirectory: string) => {
  // 检查是否为文件路径：多没有 ext 的认为是 directory
  const isFilePath = path.extname(filePathOrDirectory) !== "";

  // 如果是文件路径，获取所在的目录
  const directory = isFilePath
    ? path.dirname(filePathOrDirectory)
    : filePathOrDirectory;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
};

export const ensureIgnores = (cwd: string) => {
  const ignoreFile = '.gitignore'
  const ignorePath = `${cwd}/${ignoreFile}`
  const addedContent = '# tolstoy \n.tolstoy \n'
  // if ignoreFile not exists, create it
  if (!fs.existsSync(ignorePath)) {
    fs.writeFileSync(ignorePath, addedContent)
    return;
  }

  const content = fs.readFileSync(ignorePath, 'utf-8');
  if (content.includes('.tolstoy')) {
    return;
  }

  fs.writeFileSync(ignorePath, `${content} \n${addedContent}`)
}

export const ensureTapiConfig = (cwd: string) => {
  const configFile = 'tapi.config.js'
  const configPath = `${cwd}/${configFile}`
  if (!fs.existsSync(configPath)) {
    const defaultConfig = fs.readFileSync(`${__dirname}/../../assets/tapi.config.js`, 'utf-8')
    fs.writeFileSync(configPath, defaultConfig);
  }
}

if (require.main === module) {
  // ensureIgnores(process.cwd())
  // ensureTapiConfig(process.cwd())
  console.log(path.dirname('a/b/c'))
  console.log(path.dirname('a/b/c.ts'))
}
