import {ContextI} from './contexts';
import {SessionI} from "../boilerplate-common/shapes/session";

interface AuthorizationI {
    appContext: ContextI;
    session: SessionI;
}

class Authorization implements AuthorizationI{
    appContext: ContextI;
    session: SessionI;

    constructor(appContext?: ContextI, session?: SessionI) {
        this.appContext = appContext;
        this.session = session;
    }
}

export {
    AuthorizationI,
    Authorization
};
