import {config} from '../config/config';
import {ContextI} from '../shapes/contexts';
import * as _ from 'lodash';
import {Db, MongoClient} from 'mongodb';

let log = config.getConfiguredLog('getMongoDb');


let databases:{name:string,db:Db}[] = <{name:string,db:Db}[]>[];

function getMongoDb(context:ContextI):Promise<Db> {
  return new Promise(function(resolve,reject) {
      let database:{name:string,db:Db} = _.find(databases,{name:context.name});
      if(database) {
          resolve(database.db);
      } else {
          let url = config.getMongoUrl(context.mongoDatabase);
          log.info('Connecting to mongo database ' + url);
          MongoClient.connect(url)
              .then((db: Db) => {
                  log.info('Connected to ' + context.name + ' mongo database');
                  databases.push({name:context.name,db:db});
                  resolve(db);
              }, (err: Error) => {
                  log.error(err);
                  reject(err);
              });
      }
  });
}
function closeMongoDb(context:ContextI) {
    let database:{name:string,db:Db} = _.find(databases,{name:context.name});
    if(database) {
        database.db.close();
        databases = _.reject(databases,{name:context.name});
        log.info('Closed mongo database \'' + context.name + '\'');
    }
}
export {
  getMongoDb,closeMongoDb
}
