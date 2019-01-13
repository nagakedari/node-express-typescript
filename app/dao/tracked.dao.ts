import {AuthorizedUserI} from "../shapes/authorizedUser";
import {Db, DeleteWriteOpResultObject, InsertOneWriteOpResult, UpdateWriteOpResult} from 'mongodb';
import {getMongoDb} from "../util/getMongoDb";
import {ContextI} from "../shapes/contexts";
import {ObjectID} from "bson";
import {config} from "../config/config";
import {TrackedI} from "../boilerplate-common/shapes/tracked";

const log = config.getConfiguredLog('TrackedDao<T>');

export abstract class TrackedDao<T extends TrackedI> {
  constructor(private _collection: string, private _instantiate: (T)=>T, private _defaultSortFilter: ()=>any) {}

  getAll(context:ContextI):Promise<T[]> {
    return this.findAll(context);
  }

  findAll(context:ContextI, query?:any):Promise<T[]> {
    return new Promise<T[]>((resolve, reject)=> {
      getMongoDb(context)
        .then((db: Db) => {
          try {
            return db.collection(this._collection)
              .find(query)
              .sort(this._defaultSortFilter())
              .toArray()
              .then(results => {
                const asClasses: T[] = [];
                results.forEach(result => {
                  result.id = result._id.toHexString();
                  delete result._id;
                  asClasses.push(this._instantiate(result));
                });
                resolve(asClasses);
              }, err => {
                log.error(err);
                reject(err);
              });
          } catch (err) {
            log.error(err);
            reject(err);
          }
        }, (err: Error) => {
          log.error(err);
          reject(err);
        });
    })
  }

  getById(id: string, context: ContextI): Promise<T> {
    return this.getByKey({_id: new ObjectID(id)}, context);
  }

  getByKey(key: any, context: ContextI): Promise<T> {
    return new Promise((resolve, reject) => {
      getMongoDb(context)
        .then((db: Db) => {
          db.collection(this._collection)
            .findOne(key)
            .then((result: any) => {
              let asClass: T;
              if(result) {
                result.id = result._id;
                delete result._id;
                asClass = this._instantiate(result);
              }
              resolve(asClass);
            }, err => {
              log.error(err);
              reject(err);
            })
        }, (err: Error) => {
          log.error(err);
          reject(err);
        });
    });
  }

  create(item: T, context: ContextI): Promise<string> {
    return new Promise<string>((resolve, reject)=> {
      getMongoDb(context)
        .then((db: Db) => {
          try {
            return db.collection(this._collection)
              .insertOne(item)
              .then((result: InsertOneWriteOpResult) => {
                if(result.insertedCount === 1) {
                  resolve(result.insertedId.toHexString());
                } else {
                  log.warn(result, 'InsertOne operation did not result in one inserted result');
                  const err = new Error('InsertOne operation did not result in one inserted result');
                  reject(err);
                }
              }, err => {
                log.error(err);
                reject(err);
              });
          } catch (err) {
            log.error(err);
            reject(err);
          }
        }, (err: Error) => {
          log.error(err);
          reject(err);
        });
    })
  }

  save(item: T, context: ContextI): Promise<string> {
    return new Promise<string>((resolve, reject)=> {
      getMongoDb(context)
        .then((db: Db) => {
          try {
            return db.collection(this._collection)
              .updateOne({_id: new ObjectID(item.id)}, item, {upsert: true})
              .then((result: UpdateWriteOpResult) => {
                if(result.modifiedCount === 1) {
                  resolve(item.id);
                } else {
                  log.warn(result, 'UpdateOne operation did not result in one updated result');
                  const err = new Error('UpdateOne operation did not result in one updated result');
                  reject(err);
                }
              }, err => {
                log.error(err);
                reject(err);
              });
          } catch (err) {
            log.error(err);
            reject(err);
          }
        }, (err: Error) => {
          log.error(err);
          reject(err);
        });
    })
  }

  delete(id:string , context: ContextI): Promise<boolean> {
    return new Promise<boolean>((resolve, reject)=> {
      getMongoDb(context)
        .then((db: Db) => {
          try {
            return db.collection(this._collection)
              .deleteOne({_id: new ObjectID(id)})
              .then((result: DeleteWriteOpResultObject) => {
                if(result.deletedCount === 1) {
                  resolve(true);
                } else {
                  log.warn(result, 'DeleteOne operation did not result in one deleted result');
                  const err = new Error('DeleteOne operation did not result in one deleted result');
                  reject(err);
                }
              }, err => {
                log.error(err);
                reject(err);
              });
          } catch (err) {
            log.error(err);
            reject(err);
          }
        }, (err: Error) => {
          log.error(err);
          reject(err);
        });
    })
  }
}