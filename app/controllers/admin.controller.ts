import * as moment from 'moment';
import {Request, Response} from 'express';
import {config} from '../config/config'
import {BaseController} from './baseController';
import userService from '../services/user.service';
import {TrackedServiceBase} from '../services/tracked.service.base';
import {AuthorizationI} from '../shapes/authorization';
import {storageService} from '../services/storage.service';
import {ContextI} from '../shapes/contexts';
import {RoleType} from "../boilerplate-common/shapes/applicationRole";
import {TrackedI} from "../boilerplate-common/shapes/tracked";
import {AddStuffFromImageResult, CreateStuffFromImageResult, stuffService} from "../services/stuff.service";
import {ImageI, Image} from "../boilerplate-common/shapes/image";
import {imageService} from "../services/image.service";

let log = config.getConfiguredLog('admin.controller');

export class AdminController extends BaseController {
  constructor() {
    super();
  }

  pingToken(req: Request, res: Response) {
    log.debug('pingToken');
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if (tuple) {
          res.status(200).send([{valid: true}]);
        } else {
          res.status(200).send([{valid: false}]);
        }
      });
  }



  getStorage(req: Request, res: Response) {
    log.debug('getStorage');
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if(tuple) {
          res.status(200).send([storageService.getImagesRoot(tuple.context)]);
        }
      })
      .catch(err => {
        log.error(err);
        res.status(500).send({message: 'Internal Server Error'});
      });
  }

  getStuffs(req: Request, res: Response) {
    log.debug('getStuffs');
    this.getItems(req, res, stuffService);
  }

  getStuff(req: Request, res: Response) {
    log.debug('getStuff');
    this.getItem(req, res, stuffService);
  }

  saveStuff(req: Request, res: Response) {
    log.debug('saveStuff');
    this.saveItem(req, res, stuffService);
  }

  createStuff(req: Request, res: Response) {
    log.debug('createStuff');
    this.createItem(req, res, stuffService);
  }


  createStuffFromImage(req: Request, res: Response) {
    log.debug('createStuffFromImage');
    // TODO:  Need auth check ahead of multer...
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if (tuple) {
          return stuffService.createInventoryFromImage(tuple.context, tuple.authorization, req.file);
        } else {
          return undefined;
        }
      })
      .then((result: CreateStuffFromImageResult) => {
        if(result) {
          if (result.passedRewriteFile) {
            res.status(200).send(result.savedStuff);
          } else {
            res.status(500).send({message: 'Internal Server Error'});
          }
        } else {
          return;
        }
      })
      .catch(err => {
        log.error(err);
        res.status(500).send({message: 'Internal Server Error'});
      });
  }

  addStuffImage(req: Request, res: Response) {
    log.debug('addStuffImage');
    // TODO:  Need auth check ahead of multer...
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if(tuple) {
          return stuffService.addInventoryImage(tuple.context, tuple.authorization, req.file);
        }
        return undefined;
      })
      .then((result: AddStuffFromImageResult) => {
        if(result) {
          if (result.passedRewriteFile) {
            res.status(200).send(result.image);
          } else {
            res.status(500).send({message: 'Internal Server Error'});
          }
        }
      })
      .catch(err => {
        log.error(err);
        res.status(500).send({message: 'Internal Server Error'});
      });
  }

  deleteStuff(req: Request, res: Response) {
    log.debug('deleteStuffItem');
    this.deleteItem(req, res, stuffService);
  }

  deleteImages(req: Request, res: Response) {
    log.debug('deleteImages');
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if(tuple) {
          const images: ImageI[] = req.body;
          const imagesAsClasses: ImageI[] = [];
          images.forEach(image => {
            imagesAsClasses.push(new Image(image));
          });
          imageService.deleteImages(imagesAsClasses, tuple.context)
            .then(success => {
              if (success) {
                res.status(200).send({message: 'Success'});
              } else {
                res.status(404).send({message: 'Not found'});
              }
            })
            .catch(err => {
              log.error(err);
              res.status(500).send({message: 'Internal Server Error'});
            });
        }
      });
  }

  getItems<Y extends TrackedServiceBase<T>, T extends TrackedI>(req: Request, res: Response, service: Y) {
    log.debug('getItems');
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if (tuple) {
          service.getAll(tuple.context)
            .then(trackedItems => {
              res.status(200).send(trackedItems);
            }, err => {
              log.error(err);
              res.status(500).send({message: 'Internal Server Error'});
            });
        }
      }, err => {
        res.status(500).send({message: 'Internal Server Error'});
      });
  }

  getItem<Y extends TrackedServiceBase<T>, T extends TrackedI>(req: Request, res: Response, service: Y) {
    log.debug('getItem');
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if (tuple) {
          const id = req.params.id;
          service.get(id, tuple.context)
            .then(item => {
              res.status(200).send(item);
            }, err => {
              res.status(500).send({message: 'Internal Server Error'});
            });
        }
      })
      .catch(err => {
        res.status(500).send({message: 'Internal Server Error'});
      });
  }

  createItem<Y extends TrackedServiceBase<T>, T extends TrackedI>(req: Request, res: Response, service: Y) {
    log.debug('createItem');

    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if (tuple) {
          const username = tuple.authorization.session.username;
          const item = service.instantiate(req.body);
          item.inserted = moment().utc().valueOf();
          item.updated = item.inserted;
          item.updator = username;
          return service.create(item, tuple.context)
        } else return undefined;
      })
      .then(item => {
        if(item) {
          res.status(200).send(item);
        }
      })
      .catch(err => {
        log.error(err);
        res.status(500).send({message: 'Internal Server Error'});
      });
  }

  saveItem<Y extends TrackedServiceBase<T>, T extends TrackedI>(req: Request, res: Response, service: Y) {
    log.debug('saveItem');
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if (tuple) {
          const username = tuple.authorization.session.username;
          const item = service.instantiate(req.body);
          item.updated = moment().utc().valueOf();
          item.updator = username;
          return service.save(item, tuple.context)
        } else {
          return undefined;
        }
      })
      .then(item => {
        if(item) {
          res.status(200).send(item);
        }
      })
      .catch(err => {
        log.error(err);
        res.status(500).send({message: 'Internal Server Error'});
      });
  }

  deleteItem<Y extends TrackedServiceBase<T>, T extends TrackedI>(req: Request, res: Response, service: Y) {
    log.debug('deleteItem');
    this.authorizeAndAuthenticate(req, res, RoleType.Admin)
      .then((tuple: {authorization: AuthorizationI, context: ContextI}) => {
        if (tuple) {
          const id = req.params.id;
          service.delete(id, tuple.context)
            .then(success => {
              if (success) {
                res.status(200).send({message: 'Success'});
              } else {
                res.status(404).send({message: 'Not found'});
              }
            })
            .catch(err => {
              log.error(err);
              res.status(500).send({message: 'Internal Server Error'});
            });
        }
      });

  }

  getUser(req: Request, res: Response) {
    log.debug('getUser');
    this.getItem(req, res, userService);
  }
}


let adminController = new AdminController();

function pingToken(req: Request, res: Response) {
  adminController.pingToken(req, res);
}


function getStorage(req: Request, res: Response) {
  adminController.getStorage(req, res);
}

function getStuffs(req: Request, res: Response) {
  adminController.getStuffs(req, res);
}

function getStuff(req: Request, res: Response) {
  adminController.getStuff(req, res);
}

function saveStuff(req: Request, res: Response) {
  adminController.saveStuff(req, res);
}

function createStuffFromImage(req: Request, res: Response) {
  adminController.createStuffFromImage(req, res);
}

function addStuffImage(req: Request, res: Response) {
  adminController.addStuffImage(req, res);
}

function createStuff(req: Request, res: Response) {
  adminController.createStuff(req, res);
}

function deleteStuff(req: Request, res: Response) {
  adminController.deleteStuff(req, res);
}
function deleteImages(req: Request, res: Response) {
  adminController.deleteImages(req, res);
}



function getUser(req: Request, res: Response) {
  adminController.getUser(req, res);
}


export {
  pingToken,
  getStorage,
  getStuffs,
  getStuff,
  saveStuff,
  createStuff,
  createStuffFromImage,
  addStuffImage,
  deleteStuff,
  deleteImages,
  getUser
};
