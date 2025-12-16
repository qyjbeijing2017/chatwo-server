function isDeepEqual(obj1, obj2) {
    // 1. 简单值和引用检查
    if (obj1 === obj2) return true;

    // 2. 检查是否都是非null对象
    if (typeof obj1 !== 'object' || obj1 === null || 
        typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }

    // 3. 检查它们的构造函数是否相同（处理 Date, RegExp, Array等）
    if (obj1.constructor !== obj2.constructor) return false;

    // 4. 特殊对象处理（Date 和 RegExp）
    if (obj1 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }
    if (obj1 instanceof RegExp) {
        return obj1.toString() === obj2.toString();
    }
    
    // 5. 获取所有属性（键）
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // 6. 检查属性数量
    if (keys1.length !== keys2.length) return false;

    // 7. 递归比较每个属性的值
    for (let i = 0; i < keys1.length; i++) {
        const key = keys1[i];
        
        // 确保 obj2 包含 obj1 的所有属性，并且值递归相等
        if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}