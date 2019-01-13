import {User, UserI} from "../boilerplate-common/shapes/user";

interface AuthorizedUserI extends UserI {
    hash: string;
}

class AuthorizedUser extends User implements AuthorizedUserI {
    hash: string;
    constructor(user: AuthorizedUserI) {
        super(user);
        this.hash = user.hash;
    }
}

export {
    AuthorizedUserI,
    AuthorizedUser
};
