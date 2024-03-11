interface Section {
  title: string;
  children: string[];
}

export function convertStringToArray(input: string): Section[] {
  const lines = input.split('\n');
  const result: Section[] = [];
  let currentSection: Section | null = null;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine !== '') {
      if (/^\d+\./.test(trimmedLine)) {
        if (currentSection) {
          result.push(currentSection);
        }
        currentSection = { title: trimmedLine, children: [] };
      } else if (trimmedLine.startsWith('-')) {
        currentSection!.children.push(trimmedLine.slice(2).trim());
      }
    }
  });

  if (currentSection) {
    result.push(currentSection);
  }

  return result;
}

const input = `1. 代码可读性：
- 函数名 \`t\` 不具有描述性，应该重命名为更有意义的名称。
- 使用具有长且复杂值的内联样式可能会使代码更难阅读和维护。考虑将样式移到单独的 CSS 文件中，或者使用像 styled-components 或 emotion 这样的 CSS-in-JS 库。
- JSX 代码中的类名不具有语义性，也没有提供有关元素用途或功能的有意义信息。考虑使用更具描述性的类名来提高代码可读性。
- 对于其他可能需要在将来工作或理解代码的开发人员来说，解释某些代码段的目的或功能的注释可能会有帮助。

2. 代码可重用性和可维护性：
- CSS 代码可以通过使用 CSS 变量（自定义属性）来集中管理主题和颜色，从而受益。这将使在组件中更新或更改样式更容易。
- CSS 代码中存在一些重复的样式和类名，表明存在代码合并和可重用性的潜在机会。寻找模式，并考虑将常见样式提取为可重用的 CSS 类或实用函数。
- 重要的是检查生成的 CSS 代码中是否存在重复的样式规则，并合并或提取常见样式以减少冗余并提高可维护性。
- 组件代码可以通过实现循环或映射函数来进一步优化，减少代码重复，并使将来添加或修改元素更容易。

总体而言，通过更好的组织、更具描述性的类名以及使用 CSS 变量和代码合并技术，可以改善代码的可重用性和可维护性。`;

// const result = convertStringToArray(input);
// console.log(result);
