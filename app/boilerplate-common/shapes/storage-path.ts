export enum StoragePathType {
  InventoryImages = 0
}

export interface StoragePath {
  type: StoragePathType;
  path: string;
}
