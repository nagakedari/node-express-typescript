import * as multer from 'multer';
import {config} from '../config/config';
import {imageMimeTypes, multerLimits} from '../util/constants';

const log = config.getConfiguredLog('multipart.controller');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.env.imageProcessing.uploadDirectory)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now() + '.tmp');
  }
});


const singleImageUpload = multer({
  storage: storage,
  limits: multerLimits,
  fileFilter: (req, file, cb) => {
    if(imageMimeTypes.indexOf(file.mimetype) >= 0) {
      log.info(file.originalname + ' pass file filter stage.');
      cb(null, true);
    } else {
      const warning = file.mimetype + ' is not an accepted image upload format for ' + file.originalname;
      log.warn(warning);
      cb (null, false);
    }
  }
});

const uploadSingleImageFile = singleImageUpload.single('file');

export {
  uploadSingleImageFile
}