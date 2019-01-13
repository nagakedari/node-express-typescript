import {ApplicationRole, ApplicationRoleI} from "./applicationRole";
import {Tracked, TrackedI} from './tracked';

interface UserI extends TrackedI {
    username: string;
    name?: string;
    applicationRoles: ApplicationRoleI[];
}

class User extends Tracked implements UserI {
    username: string;
    name: string;
    applicationRoles: ApplicationRoleI[] = [];

    constructor(user: UserI) {
        super(user);
        if(user) {
            this.username = user.username;
            this.name = user.name;
            user.applicationRoles.forEach(role =>{
                this.applicationRoles.push(new ApplicationRole(role));
            });
        }
    }
}

export {
    UserI,
    User
};
