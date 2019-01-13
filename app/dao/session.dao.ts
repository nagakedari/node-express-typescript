import {config} from '../config/config';
import {getMongoDb} from '../util/getMongoDb';
import {Db, MongoError} from 'mongodb';
import {ContextI} from '../shapes/contexts';
import {SessionI} from "../boilerplate-common/shapes/session";

let log = config.getConfiguredLog('session.dao');

export class SessionDao {
    constructor() {}

    createSession(session: SessionI, context: ContextI): Promise<boolean> {
        return new Promise((resolve, reject) => {
            getMongoDb(context)
                .then((db: Db) => {
                    db.collection(('sessions'))
                        .insertOne(session)
                        .then(result => {
                            resolve(true);
                        }, err => {
                            log.error(err);
                            reject(err);
                        });
                });
        });
    }

    getSession(token: string, context: ContextI): Promise<SessionI> {
        return new Promise((resolve, reject) => {
            getMongoDb(context)
                .then((db: Db) => {
                    db.collection(('sessions'))
                        .findOne({token: token, context: context.name})
                        .then((session: SessionI) => {
                            resolve(session);
                        }, err => {
                            log.error(err);
                            reject(err);
                        });
                });
        });
    }
}

let sessionDao = new SessionDao();

export default sessionDao;