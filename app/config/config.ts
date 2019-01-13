/*
 * Created by franzzemen on 6/25/16.
 *
 * Root configuration.
 *
 * Environment specific configurations are determined as follows:
 *
 * If NODE_ENV is set in the environment, then env/[NODE_ENV].json is merged in.  For example if NODE_ENV=production,
 * then env/production.json is merged in.  If NODE_ENV is NOT set, then dev/dev.json is merged in.  Note that dev.json
 * is NOT kept in git, only dev.sample.json.  Each developer should setup their own dev.json.  In this way we can create new
 * target environments only needing to create a new configuration in the env subfolder.
 *
 * You only need to specify overrides for this root configuration, following the identical hierarchy.
 *
 * IF NO match is found in the env folder, than the defaults in this class are used (configEnv).
 */

import * as fs from 'fs';
import * as Logger from 'bunyan';
import * as _ from 'lodash';
import {joinPaths} from '../util/joinPaths';

const enum StorageType {
  local = 'local',
  s3 = 's3'
}


class Config {
  private log:Logger;
  private loggers = [];
  env = {
    port: 9000,
    log: {
      defautLevel:'debug',
      overrides: []
    },
    rest: {
      url:'http://localhost:9090',
    },
    security: {
      allowLoginWithGet: false,
      secret: 'NoSecret'
    },
    mongo: { // TODO: Move mongo configuration to application context?
      database: {
        url: 'mongodb://localhost:27017',
        options: {
          connectTimeoutMS: 1000,
          socketTimeoutMS: 5000
        }
      }
    },
    contentStorage: { // TODO: Move contentStorage configuration to application context?
      type: StorageType.s3,
      imagesSubfolder: '/images/',
      local: {
        root: '/dev/contentStorage/',
      },
      s3: {
        root: ''
      }
    },
    imageProcessing:{
      uploadDirectory: '/dev/imageProcessing/upload/',
      processedDirectory: '/dev/imageProcessing/processed/',
      watermarkDirectory: '/dev/imageProcessing/watermark/',
      watermarkCommonFileName: 'watermark.png',
    }
  };

  get secret():string {
    return this.env.security.secret;
  }

  get storageType(): StorageType {
    return this.env.contentStorage.type;
  }

  get storageRoot(): string {
    return this.env.contentStorage[this.storageType].root;
  }

  get watermarkDirectory(): string {
    return this.env.imageProcessing.watermarkDirectory;
  }

  get watermarkCommonFileName(): string {
    return this.env.imageProcessing.watermarkCommonFileName;
  }

  get processedImageDirectory(): string {
    return this.env.imageProcessing.processedDirectory;
  }
  get uploadDirectory(): string {
    return this.env.imageProcessing.uploadDirectory;
  }
  get processedDirectory(): string {
    return this.env.imageProcessing.processedDirectory;
  }

  constructor(envName?:string) {
    console.log('Configuration Initialization');
    let localEnvConfig;
    if (!envName) {
      console.log('No envName for Config, seaching NODE_ENV');
      envName = process.env['NODE_ENV'];
      if (!envName) {
        envName = 'dev';
          console.log('No NODE_ENV environment, using "dev"');
      } else {
        console.log('Found NODE_ENV=' + envName);
      }
    }
    if (envName) {
      try {
        localEnvConfig = fs.readFileSync('./app/config/env/' + envName + '.json', {encoding: 'utf8'});
      } catch (err) {
        console.log('Error reading environment file env/' + envName + 'json: ' + err.message);
        throw err;
      }
    }
    _.merge(this.env,JSON.parse(localEnvConfig));
    this.log = this.getConfiguredLog('Config');
    this.log.debug({envConfig: this.env});
  }

  getConfiguredLog(context:string):Logger {
    let configuredLog = _.find(this.loggers, {name:context});
    if (!configuredLog) {
      let bunyanConfig = _.find(this.env.log.overrides, {name:context});
      if (!bunyanConfig) {
        bunyanConfig = {name: context, level: this.env.log.defautLevel};
      }
      configuredLog = {name:context, log:Logger.createLogger(bunyanConfig)};
      this.loggers.push(configuredLog);
    }
    return configuredLog.log;
  }

  getMongoUrl(database:string) {
    return this.env.mongo.database.url + '/' + database;
  }
  getImageRoot(domain?:string): string {
    if(this.storageType === StorageType.local) {
      return joinPaths(this.storageRoot, domain, this.env.contentStorage.imagesSubfolder);
    } else if (this.storageType === StorageType.s3) {
      // For s3, we don't add the domain as part of the path, because the domain is the bucket by convention.
      return joinPaths(this.storageRoot, this.env.contentStorage.imagesSubfolder);
    }
  }

  getImagePath(imageBase: string, domain?:string): string {
    return joinPaths(this.getImageRoot(domain), imageBase);
  }
}

let config = new Config();
export {
  StorageType,
  config
};
