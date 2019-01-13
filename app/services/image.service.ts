import {config, StorageType} from '../config/config';

import {osWindows} from '../util/constants';
import * as os from "os";
import {exec} from "child_process";
import {assetService} from './asset.service';
import * as _ from 'lodash';
import {ContextI} from '../shapes/contexts';
import {fileService} from './file.service';
import s3Service from './aws/s3.service';
import {parse} from "path";
import {joinPaths} from '../util/joinPaths';
import {ImageI} from "../boilerplate-common/shapes/image";

const log = config.getConfiguredLog('ImageService');

interface ProcessImageResult {
  passedMulter?: boolean;
  multerFile?: any;
  passedImageType?: boolean;
  passedRewriteFile?: boolean;
  rewriteFile?: string;
  passedWatermarking?: boolean;
  watermarkedFile?: string;
  passedThumnailing?: boolean;
  thumbnailFile?: string;
  passedIdentification?: boolean;
  passedInstantiation?: boolean;
  passedMoveWatermark?: boolean;
  newWatermarkedFile?: string;
  passedMoveThumbnail?: boolean;
  newThumbnailFile?: string;
  dimensions?: string[];
  isS3?: boolean;
}

class ImageService {
  constructor() {}

  spacifyFilename(filename): string  {

    if(filename.indexOf(' ') >= 0) {
      if(os.type() === osWindows) {
        return '"' + filename + '"';
      } else {
        return "'" + filename + "'";
      }
    } else {
      return filename;
    }
  }

  processWatermark(watermarkFile:string, sourceFile: string, outputFile:string) : Promise<boolean> {
    const wFile = this.spacifyFilename(watermarkFile);
    const sFile = this.spacifyFilename(sourceFile);
    const oFile = this.spacifyFilename(outputFile);
    return new Promise<boolean>( (resolve, reject) => {
        exec('composite -dissolve 100% -gravity center '
          + wFile + ' ' + sFile + ' -resize 1024x1024 '
          + oFile, function (err, stdout, stderr) {
          if(err) {
            log.error(stderr);
            resolve(false);
          } else {
            log.debug('Successful watermark ' + outputFile);
            resolve(true);
          }
        });
      });
  }

  processThumbnail(sourceFile: string, outputFile:string) : Promise<boolean> {
    const sFile = this.spacifyFilename(sourceFile);
    const oFile = this.spacifyFilename(outputFile);
    return new Promise<boolean>( (resolve, reject) => {
      const osType = os.type();
      let thumbnailSize = '100x100^';
      if (osType === osWindows) {
        thumbnailSize = '"100x100^"';
      }
      exec('convert -define jpeg:size=200x200 '
        + sFile + ' -thumbnail ' + thumbnailSize + ' -gravity center -extent 100x100 '
        + oFile, function (err, stdout, stderr) {
        if(err) {
          log.error(stderr);
          resolve(false);
        } else {
          log.debug('Successful thumbnail ' + outputFile);
          resolve(true);
        }
      });
    });
  }

  identify(imageFileName: string) : Promise<string[]> {
    const iFile = this.spacifyFilename(imageFileName);
    return new Promise<string[]>( (resolve, reject) => {
      exec('identify ' + iFile, function (err, stdout, stderr) {
        if(err) {
          log.error(stderr);
          resolve(undefined);
        } else {
          const sourceFileLength = imageFileName.length;
          const removeFileName = stdout.substr(sourceFileLength);
          const values = removeFileName.split(' ');//stdout.split(' ');
          if (values.length < 3) {
            const err = new Error('Identify did not produce expected format: ' + stdout);
            log.error(err);
            resolve(undefined);
          } else {
            const dimensions = values[2].toUpperCase().split('X');
            if (dimensions.length != 2) {
              const err = new Error('Could not identify dimensions: ' + dimensions);
              log.error(err);
              resolve(undefined);
            }
            log.debug('Successful identification ' + imageFileName);
            resolve(dimensions);
          }
        }
      });
    });
  }

  deleteImages(images: ImageI[], context: ContextI): Promise<boolean> {
    const allDeletions: Promise<boolean>[] = [];
    images.forEach(image => {
      let path;
      if (image.thumbnail) {
        path = config.getImagePath(image.thumbnail.name, context.domain);
        allDeletions.push(assetService.deleteAsset(path, 'Deleting thumbnail ' + image.thumbnail.name, context.domain));
      }
      path = config.getImagePath(image.name, context.domain);
      allDeletions.push(assetService.deleteAsset(path, 'Deleting image ' + image.name, context.domain));
    });
    return Promise.all(allDeletions)
      .then(deletions => {
        let finalSuccess = true;
        _.each(deletions, deletion => {
          if (!deletion) {
            finalSuccess = false;
            return false;
          }
        });
        return finalSuccess;
      });
  }

  processsAndSaveUploadedImage(context: ContextI, result: ProcessImageResult, multerFile): Promise<ProcessImageResult> {
    if (!multerFile) {
      result.passedMulter = false;
      return Promise.resolve(result)
    } else {
      result.passedMulter = true;
      result.multerFile = multerFile;
    }
    return fileService.getFileType(multerFile)
      .then((typedFile: { buffer: Buffer, ext: string }) => {
        if (!typedFile) {
          result.passedImageType = false;
          this.cleanup(context, result);
          return result;
        } else {
          result.passedImageType = true;
          const parsed = parse(multerFile.path);
          log.debug(parsed, 'Parsed');
          const baseName = joinPaths(config.processedImageDirectory, parsed.name);
          result.rewriteFile = baseName + '.' + typedFile.ext;
          result.watermarkedFile = baseName + '-wm.jpg';
          result.thumbnailFile = baseName + '-tn.png';

          return fileService.writeFile(result.rewriteFile, typedFile.buffer)
            .then((writeResult: boolean) => {
              if (!writeResult) {
                result.passedRewriteFile = false;
                this.cleanup(context, result);
              } else {
                result.passedRewriteFile = true;
              }
              return result;
            });
        }
      })
      .then((result) => {
        if (!result.passedRewriteFile) {
          this.cleanup(context, result);
          return result;
        }
        const watermarkFile = joinPaths(config.watermarkDirectory, context.domain + '.' + config.watermarkCommonFileName);
        return imageService.processWatermark(watermarkFile, result.rewriteFile, result.watermarkedFile)
          .then(success => {
            if (!success) {
              result.passedWatermarking = false;
              this.cleanup(context, result);
            } else {
              result.passedWatermarking = true;
            }
            return result;
          });
      })
      .then((result) => {
        if (!result.passedWatermarking) {
          this.cleanup(context, result);
          return result;
        }
        return imageService.processThumbnail(result.rewriteFile, result.thumbnailFile)
          .then(success => {
            if (!success) {
              result.passedThumnailing = false;
              this.cleanup(context, result);
            } else {
              result.passedThumnailing = true;
            }
            return result;
          });
      })
      .then(result => {
        if(result.passedThumnailing) {
          return imageService.identify(result.watermarkedFile)
            .then(dimensions => {
              if (!dimensions) {
                result.passedIdentification = false;
                this.cleanup(context, result);
              } else {
                result.passedIdentification = true;
                result.dimensions = dimensions;
              }
              return result;
            });
        } else {
          return result;
        }
      })
      .then(result => {
        if(result.passedIdentification) {
          if (config.storageType === StorageType.local) {
            result.isS3 = false;
            let parsed = parse(result.watermarkedFile);
            result.newWatermarkedFile = config.getImagePath(parsed.base, context.domain);
            parsed = parse(result.thumbnailFile);
            result.newThumbnailFile = config.getImagePath(parsed.base, context.domain);
            return fileService.moveFile(result.watermarkedFile, result.newWatermarkedFile, 'Watermark File')
              .then(success => {
                if (!success) {
                  result.passedMoveWatermark = false;
                  this.cleanup(context, result);
                } else {
                  result.passedMoveWatermark = true;
                }
                return result;
              })
              .then(result => {
                return fileService.moveFile(result.thumbnailFile, result.newThumbnailFile, 'Thumbnail File')
                  .then(success => {
                    if (!success) {
                      result.passedMoveThumbnail = false;
                      this.cleanup(context, result);
                    } else {
                      result.passedMoveThumbnail = true;
                    }
                    return result;
                  });
              });
          } else {
            result.isS3 = true;
            let parsed = parse(result.watermarkedFile);
            result.newWatermarkedFile = config.getImagePath(parsed.base);
            parsed = parse(result.thumbnailFile);
            result.newThumbnailFile = config.getImagePath(parsed.base);//'images/' + parsed.base;
            return s3Service.uploadFile(result.watermarkedFile, context.domain, result.newWatermarkedFile)
              .then(success => {
                if (!success) {
                  result.passedMoveWatermark = false;
                  this.cleanup(context, result);
                } else {
                  result.passedMoveWatermark = true;
                }
                return result;
              })
              .then(result => {
                return s3Service.uploadFile(result.thumbnailFile, context.domain, result.newThumbnailFile)
                  .then(success => {
                    if (!success) {
                      result.passedMoveThumbnail = false;
                      this.cleanup(context, result);
                    } else {
                      result.passedMoveThumbnail = true;
                    }
                    return result;
                  });
              });
          }
        } else {
          return result;
        }
      });
  }

  cleanup(context: ContextI, result: ProcessImageResult, keepFinalResult = false) {
    // Processing is asynchronous, but we don't care to return the result.  This is cleanup.
    if (result.passedMulter) {
      fileService.deleteLocalFile(result.multerFile.path, 'Multer File');
    }
    if (result.passedRewriteFile) {
      fileService.deleteLocalFile(result.rewriteFile, 'Rewrite File');
    }
    if (result.passedWatermarking) {
      fileService.deleteLocalFile(result.watermarkedFile, 'Watermark File');
    }
    if (result.passedThumnailing) {
      fileService.deleteLocalFile(result.thumbnailFile, 'Thumbnail File');
    }
    if (!keepFinalResult) {
      if (result.passedMoveWatermark) {
        assetService.deleteAsset(result.newWatermarkedFile, 'Watermark File (content)', context.domain);
      }
      if (result.passedMoveThumbnail) {
        assetService.deleteAsset(result.newThumbnailFile, 'Thumbnail File (content)', context.domain);
      }
    }
  }
}

const imageService = new ImageService();
export {
  ProcessImageResult,
  imageService
};
