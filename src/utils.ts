export function getPath(obj: any, path: string): any {
  if (!path || !obj) return undefined;
  if (!path.includes('.')) return obj[path];
  
  return path.split('.').reduce((acc, part) => {
    return acc && typeof acc === 'object' ? acc[part] : undefined;
  }, obj);
}

export function hasPath(obj: any, path: string): boolean {
  if (!path || !obj) return false;
  if (!path.includes('.')) return Object.prototype.hasOwnProperty.call(obj, path);
  
  let current = obj;
  const parts = path.split('.');
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) {
      return false;
    }
    current = current[part];
  }
  return true;
}

export function setPath(obj: any, path: string, value: any): void {
  if (!path) return;
  if (!path.includes('.')) {
    obj[path] = value;
    return;
  }

  const parts = path.split('.');
  const lastKey = parts.pop()!;
  
  let current = obj;
  for (const part of parts) {
    if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[lastKey] = value;
}