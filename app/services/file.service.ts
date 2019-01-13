import * as fs from "fs";
import {config} from '../config/config';
import * as readChunk from 'read-chunk';
import {imageMimeTypes, maxImageSize} from '../util/constants';
import * as fileType from 'file-type';

const log = config.getConfiguredLog('FileService');

class FileService {

  constructor() {}

  deleteLocalFile(fullPath:string, shortNote: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.access(fullPath, err => {
        if (err) {
          log.warn('Cannot delete ' + shortNote + ' as it is not accessible: ' + fullPath);
          resolve(false);
        }
        else {
          log.debug('Deleting ' + shortNote + ':' + fullPath);
          fs.unlink(fullPath, err => {
            if (err) {
              log.warn('Cannot delete ' + shortNote + ': ' + fullPath);
              resolve(false);
            } else {
              log.debug('Deleted ' + shortNote + ': ' + fullPath);
              resolve(true);
            }
          });
        }
      });
    });
  }

  writeFile(path: string, buffer: Buffer): Promise<boolean> {
    return new Promise<boolean>((resolve,reject)=> {
      fs.writeFile(path, buffer, err => {
        if(err) {
          log.warn('Failed to write file ' + path);
          resolve(false);
        } else {
          log.debug('Wrote file ' + path);
          resolve(true);
        }
      });
    });
  }

  getFileType(multerFile): Promise<{buffer:Buffer,ext:string}> {
    return readChunk(multerFile.path, 0, maxImageSize)
      .then(buffer => {
        const magicNumberType = fileType (buffer);
        if(imageMimeTypes.indexOf(magicNumberType.mime) >= 0) {
          log.debug (multerFile.path + ' passed magic number');
          return {buffer:buffer, ext:magicNumberType.ext};
        } else {
          log.warn(multerFile.path + ' failed magic number');
          return undefined;
        }
      });
  }

  moveFile(oldPath, newPath, fileType:string): Promise<boolean> {
    return new Promise<boolean>( (resolve,reject) => {
      fs.rename(oldPath, newPath, err => {
        if(err) {
          log.error(err);
          resolve(false);
        } else {
          log.debug('Moved ' + fileType + ': ' + oldPath + ' to ' + newPath);
          resolve(true);
        }
      })
    });
  }
}

const fileService = new FileService();

export {
  FileService,
  fileService
};
