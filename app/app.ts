import {config, StorageType} from './config/config';
import {getMongoDb,closeMongoDb} from './util/getMongoDb';
import * as express from 'express';
import {Request} from "express";
import * as bodyParser from 'body-parser';
import topRouter from './routes/top.router';
import {Strategy, StrategyOptions} from 'passport-jwt';
import * as fs from 'fs';
import contextService from './services/context.service';
import s3Service from './services/aws/s3.service';
import {joinPaths} from "./util/joinPaths";

const log = config.getConfiguredLog('app');
log.info('Verifying Mongo Connection...');
let app;
getMongoDb({name: 'init', mongoDatabase: 'init'})
  .then(db => {
    closeMongoDb({name: 'init', mongoDatabase: 'init'});
    return true;
  })
  .then(success => {
    log.info('Setup passpport');
    let opts: StrategyOptions = {
      secretOrKey: config.secret,
      jwtFromRequest: (request: Request) => {
        return request.query.jwt ? request.query.jwt : null;
      },
      passReqToCallback: true
    };
    //passport.use
    log.info('Setup express');
    app = express();
    app.use(function(req, res, next) {
      //set headers to allow cross origin request.
      res.header("Access-Control-Allow-Origin", "*");
      res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    log.info('Setup body-parser');
    app.use(bodyParser.json());
    app.use(topRouter);

    return contextService.getContexts()
      .then(contexts => {
        log.info('Verifying image processing directories');
        if(!fs.existsSync(config.uploadDirectory)) {
          log.warn(config.uploadDirectory + ' does not exist, not creating!  Uploads will fail');
        }
        else {
          log.info(config.uploadDirectory + ' found.  This is where multer will put uploads');
        }
        if(!fs.existsSync(config.processedDirectory)) {
          log.warn(config.processedDirectory + ' does not exist, not creating!  Upload processing will fail');
        }
        else {
          log.info(config.processedDirectory + ' found.  This is where processed files will be put and handled prior to moving to content folders');
        }
        contexts.forEach(context => {
          const watermarkFile = joinPaths(config.watermarkDirectory, context.domain + '.' + config.watermarkCommonFileName);
          if(!fs.existsSync(watermarkFile)) {
            log.warn(watermarkFile + ' does not exist, not creating!  Watermarking will fail');
          }
          else {
            log.info(watermarkFile + ' found.  This is the watermark png with transparent background that will be applied to image content');
          }
          if (config.storageType === StorageType.local) {
            log.info('Using Local Content Server');
            log.info('Verifying local content directory for context ' + context.name);
            let imagesDirectory = config.env.contentStorage.local.root + context.domain + '/images';
            if (!fs.existsSync(imagesDirectory)) {
              log.warn(imagesDirectory + ' does not exist, not creating!  Content will not be retrievable');
            } else {
              log.info(imagesDirectory + ' found.  Images for ' + context.name + ' will be retrieved from here.');
              app.use('/api/images/', express.static(imagesDirectory));
            }
            // Do the same for other types of content...
            return true;
          } else if (config.storageType === StorageType.s3) {
            log.info('Using S3 Content Server');
            log.info('Verifying s3 content directory for context ' + context.name);
            const promises:Promise<boolean>[] = [];
            promises.push(s3Service.checkBucket(context.domain, 'images/boot.jpg'));
            return Promise.all(promises)
              .then(results => {
                return true;
              })
              .catch(err => {
                log.error(err);
                throw err;
              });
          }
        });
      });
  })
  .then( success => {
    app.listen(config.env.port, function () {
      log.info('Server started on ' + config.env.port);
    });
  })
  .catch(err => {
    log.error(err, 'Promise Error Caught');
    process.exit(1000);
  });

