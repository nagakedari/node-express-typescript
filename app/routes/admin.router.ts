import {config} from "../config/config";
import * as express from 'express';
import {Router} from 'express';
import * as adminController from '../controllers/admin.controller';
import {login} from '../controllers/login.controller';
import {uploadSingleImageFile} from '../controllers/multipart.controller';

let adminRouter:Router = express.Router();

if(config.env.security.allowLoginWithGet) {
  adminRouter.get('/login', login);
}
adminRouter.post('/login',login);

adminRouter.get('/:application/entity/storage', adminController.getStorage);
adminRouter.get('/:application/entity/ping', adminController.pingToken);
adminRouter.get('/:application/entity/stuff', adminController.getStuffs);
adminRouter.get('/:application/entity/stuff/:id', adminController.getStuff);
adminRouter.put('/:application/entity/stuff/:id', adminController.saveStuff);
adminRouter.post('/:application/entity/stuff', adminController.createStuff);
adminRouter.post('/:application/entity/stuff/image', uploadSingleImageFile, adminController.createStuffFromImage);
adminRouter.post('/:application/entity/stuff/image/new', uploadSingleImageFile, adminController.addStuffImage);
adminRouter.delete('/:application/entity/stuff/:id', adminController.deleteStuff);
adminRouter.put('/:application/images/delete', adminController.deleteImages);

export default adminRouter;