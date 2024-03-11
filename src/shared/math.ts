/**
 * eg: compute cpu average
  const cpuSum = cpuList.reduce((a, b) => a + b, 0);
  const cpuAvg = cpuSum / cpuList.length;
 */
export function avg(list: number[]) {
  const sum = list.reduce((a, b) => a + b, 0);
  return sum / list.length;
}

/**
 *  获取波动率 
 *  */
export function getVolatility(list: number[]) {
  const listAvg = avg(list);
  const variance = list.reduce((a, b) => a + (b - listAvg) ** 2, 0) / list.length;
  return Math.sqrt(variance);
}
