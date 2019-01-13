import s3Service from './aws/s3.service';
import {config, StorageType} from '../config/config';
import {fileService} from './file.service';

const log = config.getConfiguredLog('AssetService');

class AssetService {
  constructor () {}





  deleteAsset(fullPath: string, shortNote: string, domain?: string): Promise<boolean> {
    let storageType = config.storageType;
    let msg = shortNote + ' for storage type ' + storageType;
    if(storageType === StorageType.s3) {
      msg += ' and domain ' + domain;
    }
    if(storageType === StorageType.local) {
      return fileService.deleteLocalFile(fullPath, shortNote);
    } else if (storageType === StorageType.s3) {
      // Don't check if its there, just try and delete it
      if(!domain)  {
        const err = new Error('Attempt to delete object in s3 without providing a domain');
        log.error();
        throw err;
      }
      log.debug('Deleting ' + msg + ': ' + fullPath);
      return s3Service.deleteObject(domain, fullPath)
        .then(success => {
          log.debug('Deleted ' + msg + ': ' + fullPath);
          return success;
        });
    }
  }
}

const assetService = new AssetService();

export {
  AssetService,
  assetService
};
