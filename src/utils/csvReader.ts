/**
 * CSV 读取工具函数
 * 支持引号内的换行符
 */

/**
 * 解析CSV字符串为二维字符串数组
 * @param csvContent CSV文件内容字符串
 * @param delimiter 分隔符，默认为逗号
 * @returns string[][] 二维字符串数组
 */
export function parseCsv(csvContent: string, delimiter: string = ','): string[][] {
    if (!csvContent || !csvContent.trim()) {
        return [];
    }

    const result: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < csvContent.length) {
        const char = csvContent[i];
        const nextChar = i + 1 < csvContent.length ? csvContent[i + 1] : '';

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // 转义的引号 ""
                currentField += '"';
                i += 2;
                continue;
            } else {
                // 开始或结束引号
                inQuotes = !inQuotes;
                i++;
                continue;
            }
        }

        if (!inQuotes) {
            if (char === delimiter) {
                // 字段分隔符
                currentRow.push(currentField.trim());
                currentField = '';
                i++;
                continue;
            } else if (char === '\n' || char === '\r') {
                // 行分隔符
                currentRow.push(currentField.trim());
                if (currentRow.length > 0 || currentField.trim()) {
                    result.push(currentRow);
                }
                currentRow = [];
                currentField = '';
                
                // 跳过 \r\n 中的 \n
                if (char === '\r' && nextChar === '\n') {
                    i += 2;
                } else {
                    i++;
                }
                continue;
            }
        }

        // 普通字符（包括引号内的换行符）
        currentField += char;
        i++;
    }

    // 处理最后一个字段和行
    currentRow.push(currentField.trim());
    if (currentRow.length > 0 || currentField.trim()) {
        result.push(currentRow);
    }

    return result;
}