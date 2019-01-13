import {config} from '../config/config';
import {getMongoDb} from '../util/getMongoDb';
import {ContextI} from '../shapes/contexts';
import {Db, MongoError} from 'mongodb';

let log = config.getConfiguredLog('context.dao');

export class ContextDao {
    constructor() {}

    getContexts(context: ContextI): Promise<ContextI[]> {
        return new Promise<ContextI[]>((resolve, reject) => {
            getMongoDb(context)
                .then((db:Db) => {
                    db.collection('appContexts')
                        .find()
                        .toArray()
                        .then((contexts: ContextI[]) => {
                            resolve(contexts);
                        }, err => {
                            log.error(err);
                            reject(err);
                        })
                },(err:Error) => {
                    log.error(err);
                    reject(err);
                });
        });
    }
}

let contextDao = new ContextDao();

export default contextDao;