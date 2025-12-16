export function snowflakeLogId() {
    const ts36 = Date.now().toString(36);  // 时间
    const rand36 = Math.floor(Math.random()*36*36).toString(36); // 两位随机
    return ts36 + rand36;
}