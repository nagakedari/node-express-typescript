import {Promise} from 'bluebird';
import {config} from '../config/config';
import userDao from '../dao/user.dao';
import {ContextI} from '../shapes/contexts';
import {AuthorizedUserI} from '../shapes/authorizedUser';
import {TrackedServiceBase} from './tracked.service.base';
import {User, UserI} from "../boilerplate-common/shapes/user";

let log = config.getConfiguredLog('user.service');

class UserService extends TrackedServiceBase<UserI> {
    constructor() {
      super(userDao, (shape)=>{return new User(shape)});
    }

    getAuthorizedUserByUserName (username: string, context: ContextI): Promise<AuthorizedUserI> {
        return userDao.getUserByUserName(username, context);
    }

    getUserByUserName (username:string, context: ContextI): Promise<UserI> {
        return userDao.getUserByUserName(username, context)
            .then(user => {
                delete user.hash;
                return user;
            });
    }
}

const userService = new UserService();
export default userService;