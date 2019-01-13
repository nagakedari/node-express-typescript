import {Request,Response} from 'express';
import {config} from '../config/config'
import sessionService from '../services/session.service';
import {BaseController} from './baseController';
import {CredentialsI} from "../boilerplate-common/shapes/credentials";
import {validatePassword, validateUsername} from "../boilerplate-common/util/regex";
import {SessionI} from "../boilerplate-common/shapes/session";

let log = config.getConfiguredLog('admin.controller');

export class LoginController extends BaseController {
    constructor() {
        super();
    }

    login(req:Request,res:Response) {
        let credentials: CredentialsI = req.body;
        if(!credentials.username || !credentials.password) {
            credentials = req.query;
            if (!credentials.username || !credentials.password) {
                console.info('Missing credentials');
                res.status(401).send({message:'Unauthorized'});
                return;
            }
        } else {
            log.debug("Attempting login for " + credentials.username);
        }
        if (!validateUsername(credentials.username)|| !validatePassword(credentials.password)) {
            console.info('Invalid credentials');
            res.status(401).send('Unauthorized');
            return;
        }

        this.getClientAppContext(req, res)
            .then(context => {
                if(context) {
                    sessionService.login(credentials, context)
                        .then((session: SessionI) => {
                            if(session && session.token && session.token.trim().length > 0) {
                                log.debug(session, 'User logged in');
                                res.status(200).send(session);
                            } else {
                                log.debug(credentials, 'Unauthorized');
                                res.status(401).send('Unauthorized');
                            }
                        }, (err) => {
                            log.error(err);
                            res.status(500).send('Internal Server Error');
                        });
                } else {
                    // Response already handled by getClientAppContext
                }
            });
    }
}

let loginController = new LoginController();

function login(req:Request, res:Response) {
    loginController.login(req,res);
}

export {
    login,
}