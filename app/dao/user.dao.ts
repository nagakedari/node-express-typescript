import {config} from '../config/config';
import {AuthorizedUser, AuthorizedUserI} from '../shapes/authorizedUser';
import {ContextI} from '../shapes/contexts';
import {TrackedDao} from "./tracked.dao";
import {getMongoDb} from '../util/getMongoDb';
import {Db} from 'mongodb';
import {UserI} from "../boilerplate-common/shapes/user";

let log = config.getConfiguredLog('userDao.dao');

export class UserDao extends TrackedDao<UserI> {
    constructor() {
      super('users', (shape)=>{return new AuthorizedUser(shape)}, ()=> {return {username: 1};});
    }
    getUserByUserName(username: string, context:ContextI): Promise<AuthorizedUserI> {
        return new Promise((resolve, reject) => {
            getMongoDb(context)
                .then((db: Db) => {
                    db.collection('users')
                        .findOne({username: username})
                        .then((user: AuthorizedUserI) => {
                            resolve(user);
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
}

let userDao = new UserDao();

export default userDao;