import fs from 'fs';
// TODO: need to read from env
let  defaultDbPath = '';
/**
 * 使用 JSON 文件作为数据库。
 * 生产环境中，你可能需要使用: SQLite 或者其他支持并发写入的数据库。 
 * https://github.com/microsoft/vscode/blob/main/src/vs/base/parts/storage/node/storage.ts
 * 
 */
let dbPath = defaultDbPath;

export const setDbPath = (path: string) => {
  dbPath = path;
  // 检查文件是否存在，不存在则创建一个空的 json 文件
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}));
  }
}

export async function initializeDatabase(path: string = defaultDbPath) {
  setDbPath(path);
  console.log(`JSON database has been initialized at ${path}`);
}

export function saveCacheDataToDatabase(cacheData: Record<string, any>) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  // 使用文件路径作为键来存储每个 CacheData 对象
  // FIXME: not efficient
  const cp = { ...cacheData }
  delete cp.filePath;
  delete cp.data;
  data[cacheData.filePath] = cp;

  fs.writeFileSync(dbPath, JSON.stringify(data));
  console.log(`Data saved to JSON database.`);
}

/**
 * 再次强调，这里写着玩的，每次读取整个文件显然不必要。
 * @param localFilePath 
 * @returns 
 */
export function getCacheDataFromDatabase(localFilePath: string): Promise<Record<string, Record<string, any>> | null> {
  return new Promise((resolve, reject) => {
    try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    resolve(data[localFilePath] || null);
    } catch (e) {
      console.error('Failed to read JSON database');
      reject(e)
    }
  });
}
