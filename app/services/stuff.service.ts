import * as moment from 'moment';
import * as _ from 'lodash';
import {TrackedServiceBase} from './tracked.service.base';
import {ContextI} from '../shapes/contexts';
import {parse} from 'path';
import {config} from '../config/config';
import {imageService, ProcessImageResult} from './image.service';
import {AuthorizationI} from '../shapes/authorization';
import {ImageI, Image, Thumbnail} from "../boilerplate-common/shapes/image";
import {Stuff, StuffI} from "../boilerplate-common/shapes/stuff";
import {stuffDao} from "../dao/stuff.dao";

enum ResultType {
  CreateStuffFromImage,
  AddImageToStuff
}

interface CreateStuffFromImageResult extends ProcessImageResult {
  type: ResultType;
  passedRecordSave?: boolean;
  stuff?: StuffI;
  savedStuff?: StuffI;
}

interface AddStuffFromImageResult extends ProcessImageResult {
  type: ResultType;
  passedImageInstantiation?: boolean;
  image?: ImageI;
}

function resultIsCreateStuffFromImageResult(result: ProcessImageResult | CreateStuffFromImageResult | AddStuffFromImageResult): result is CreateStuffFromImageResult {
  if(result['type'] !== undefined && result['type'] === ResultType.CreateStuffFromImage) {
    return true
  }
}

function resultIsAddStuffFromImageResult(result: ProcessImageResult | CreateStuffFromImageResult | AddStuffFromImageResult): result is AddStuffFromImageResult {
  if(result['type'] !== undefined && result['type'] === ResultType.AddImageToStuff) {
    return true
  }
}

const log = config.getConfiguredLog('StuffService');

class StuffService extends TrackedServiceBase<StuffI> {
  constructor() {
    super(stuffDao, (shape) => {
      return new Stuff(shape)
    });
  }

  save(stuff: StuffI, context: ContextI): Promise<StuffI> {
    return this.get(stuff.id, context)
      .then(oldStuff => {
        return super.save(stuff, context)
          .then(savedStuff => {
            // Find all the deleted images
            let deleteImage: ImageI;
            if(oldStuff.image && oldStuff.image.name) {
              if(savedStuff.image && savedStuff.image.name) {
                if(oldStuff.image.name != savedStuff.image.name) {
                  deleteImage = oldStuff.image;
                }
              } else {
                deleteImage = oldStuff.image;
              }
            }
            if(deleteImage) {
              return imageService.deleteImages([oldStuff.image],context)
                .then(result => {
                  return savedStuff;
                });
            } else {
              return savedStuff;
            }
          });
      });
  }

  addInventoryImage(context: ContextI, authorization: AuthorizationI, multerFile): Promise<AddStuffFromImageResult> {
    let result: CreateStuffFromImageResult = {type: ResultType.AddImageToStuff};
    return imageService.processsAndSaveUploadedImage(context, result, multerFile)
      .then(result => {
        if(resultIsAddStuffFromImageResult(result)) {
          const parseWatermark = parse(result.watermarkedFile);
          const parseThumbnail = parse(result.thumbnailFile);
          const image = new Image();
          image.name = parseWatermark.base;
          image.width = parseFloat(result.dimensions[0]);
          image.height = parseFloat(result.dimensions[1]);
          image.thumbnail = new Thumbnail();
          image.thumbnail.name = parseThumbnail.base;
          image.thumbnail.width = 100;
          image.thumbnail.height = 100;
          result.passedImageInstantiation = true;
          result.image = image;
          return result;
        }
      })
      .then(result => {
        if (result.passedImageInstantiation) {
          imageService.cleanup(context, result, true);
        } else {
          imageService.cleanup(context, result);
        }
        return result;
      });
  }

  createInventoryFromImage(context: ContextI, authorization: AuthorizationI, multerFile): Promise<CreateStuffFromImageResult> {
    let result: CreateStuffFromImageResult = {type: ResultType.CreateStuffFromImage};
    return imageService.processsAndSaveUploadedImage(context, result, multerFile)
      .then(result => {
        if(resultIsCreateStuffFromImageResult(result)) {
          const parseWatermark = parse(result.watermarkedFile);
          const parseThumbnail
            = parse(result.thumbnailFile);
          const stuff = new Stuff();
          stuff.name = multerFile.originalname;
          stuff.image =new Image();
          stuff.image.name = parseWatermark.base;
          stuff.image.width = parseFloat(result.dimensions[0]);
          stuff.image.height = parseFloat(result.dimensions[1]);
          stuff.image.thumbnail = new Thumbnail();
          stuff.image.thumbnail.name = parseThumbnail.base;
          stuff.image.thumbnail.width = 100;
          stuff.image.thumbnail.height = 100;
          stuff.inserted = +moment();
          stuff.updated = stuff.inserted;
          stuff.updator = authorization.session.username;
          log.debug({stuff: stuff});
          result.stuff = stuff;
          result.passedInstantiation = true;
          return result;
        }
      })
      .then(result => {
        return this.create(result.stuff, context)
          .then((savedStuff) => {
            result.savedStuff = savedStuff;
            result.passedRecordSave = true;
            return result;
          })
      })
      .then(result => {
        if (result.passedRecordSave) {
          imageService.cleanup(context, result, true);
        } else {
          imageService.cleanup(context, result);
        }
        return result;
      });
  }



  delete(id: string, context: ContextI): Promise<boolean> {
    let stuff: StuffI;
    return this.get(id, context)
      .then(retrievedStuff => {
        stuff = retrievedStuff;
        return super.delete(id, context)
          .then(success => {
            return success;
          })
      })
      .then(success => {
        if (!success) {
          return false;
        } else {
          return imageService.deleteImages([stuff.image], context)
            .then(imageSuccess => {
              if(!imageSuccess) {
                log.warn("Potential issues deleting images");
              }
              return success;
            });
        }
      });
  }
}

const stuffService = new StuffService();

export {
  StuffService,
  stuffService,
  CreateStuffFromImageResult,
  AddStuffFromImageResult
}