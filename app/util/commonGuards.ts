function isStringGuard(shape: any | string): shape is string {
  return typeof shape === 'string';
}

export {
  isStringGuard
}
