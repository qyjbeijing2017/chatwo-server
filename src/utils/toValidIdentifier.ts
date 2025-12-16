export function toValidIdentifier(str) {
  return (
    str
      // 非标识符字符 → 下划线
      .replace(/[^a-zA-Z0-9_$]/g, "_")
      // 不能以数字开头 → 前缀一个下划线
      .replace(/^(\d)/, "_$1")
      // 连续下划线压缩
      .replace(/_+/g, "_")
      // 如果为空，返回默认标识符
      || "_"
  );
}