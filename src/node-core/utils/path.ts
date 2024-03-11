import * as path from 'path';

/**
 * 直接使用 endsWith() 方法对于跨平台路径判断会遇到问题，特别是在处理 Windows 和 macOS/Unix 系统之间的路径分隔符差异时。
 *
 * @param inputPath
 * @param targetSubPath
 * @returns
 */
export function isPathEndingWith(inputPath: string, targetSubPath: string): boolean {
  // 将输入路径和目标子路径标准化，以处理不同平台的分隔符
  const normalizedInputPath = path.normalize(inputPath).replace(/\\/g, '/');
  const normalizedTargetSubPath = path.normalize(targetSubPath).replace(/\\/g, '/');

  // 使用 endsWith() 方法检查标准化后的路径是否匹配
  return normalizedInputPath.endsWith(normalizedTargetSubPath);
}


// 示例
// if (require.main === module) {
//   const windowsPath = 'C:\\restapi\\projects\\1';
//   const macPath = '/restapi/projects/1';

//   const targetSubPath = '/restapi/projects/1';

//   const resultWindows = isPathEndingWith(windowsPath, targetSubPath);
//   console.log(resultWindows); // 输出：true

//   const resultMac = isPathEndingWith(macPath, targetSubPath);
//   console.log(resultMac); // 输出：true
// }

export function getFilenameFromPath(filePath: string) {
  return path.basename(filePath);
}

if (require.main === module) {
  const filePath = '/path/to/your/file.txt';
  const filename = getFilenameFromPath(filePath);
  console.log(filename); // 'file.txt'
}
