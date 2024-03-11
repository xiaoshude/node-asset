interface JsonValue {
  [key: string]: any;
}

interface Differences {
  [key: string]: {
    from: any;
    to: any;
  } | Differences;
}

export function compareJson(json1: JsonValue, json2: JsonValue, path: string = ''): Differences {
  const differences: Differences = {};
  const keys = new Set([...Object.keys(json1), ...Object.keys(json2)]);

  keys.forEach(key => {
    const newPath = path ? `${path}.${key}` : key;
    const value1 = json1[key];
    const value2 = json2[key];

    // Skip if values are equal
    if (value1 === value2) {
      return;
    }

    // falsy values are equal
    if (!value1 && !value2) {
      return;
    }

    // Recurse if both values are objects
    if (typeof value1 === 'object' && value1 !== null && typeof value2 === 'object' && value2 !== null) {
      const nestedDifferences = compareJson(value1, value2, newPath);
      if (Object.keys(nestedDifferences).length > 0) {
        differences[newPath] = nestedDifferences;
      }
    } else if (Array.isArray(value1) && Array.isArray(value2)) {
      // Compare arrays
      if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        differences[newPath] = { from: value1, to: value2 };
      }
    } else {
      // Directly compare values
      differences[newPath] = { from: value1, to: value2 };
    }
  });

  return differences;
}

export function formatDifferences(differences: Differences, prefix: string = ''): string {
  let result = '';

  Object.entries(differences).forEach(([key, value]) => {
    // 如果值是 Differences 对象，则递归调用 formatDifferences
    if (typeof value === 'object' && ('from' in value || 'to' in value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const from = 'from' in value ? `从 【"${value.from}"】` : '未设置';
      const to = 'to' in value ? `变更为 【"${value.to}"】` : '被移除';
      result += `${path}: ${from} ${to}\n`;
    } else if (typeof value === 'object') {
      result += formatDifferences(value as Differences, key);
    }
  });

  return result;
}

// test
if (require.main === module) {
  // Example usage
  const json1: JsonValue = {
    "znt_uid": "0",
    "znt_extra_info": {
      "znt_mult_lang_infos": {
        "en": {
          "welcome_text": "Hello",
        }
      },
      "welcome_text_suggestions": ["Hi", "Hello", "Welcome"]
    }
  };

  const json2: JsonValue = {
    "znt_uid": "1",
    "znt_extra_info": {
      "znt_mult_lang_infos": {
        "en": {
          "welcome_text": "Hello there",
        }
      },
      "welcome_text_suggestions": ["Hello", "Welcome"]
    }
  };

  const differences = compareJson(json1, json2);
  console.log('differences', JSON.stringify(differences, null, 2));

  const formattedDifferences = formatDifferences(differences);
  console.log('formattedDifferences', formattedDifferences);
}
