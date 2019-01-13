import {config, StorageType} from '../config/config';
import {ContextI} from '../shapes/contexts';
import {StoragePath, StoragePathType} from "../boilerplate-common/shapes/storage-path";



class StorageService {
  constructor() {}

  getImagesRoot(context: ContextI): StoragePath {
    if(config.storageType === StorageType.local) {
      return {type: StoragePathType.InventoryImages, path: '/api/images/'};
    } else if (config.storageType === StorageType.s3) {
      return {type: StoragePathType.InventoryImages, path: 'http://' + context.domain + '.s3.amazonaws.com/images/'};
  }
}
}

const storageService = new StorageService();

export {
  StorageService,
  storageService
}