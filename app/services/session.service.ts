import * as _ from 'lodash';
import {config} from '../config/config';
import {sign} from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import sessionDao from '../dao/session.dao';
import userService from './user.service';
import {ContextI} from '../shapes/contexts';
import {CredentialsI} from "../boilerplate-common/shapes/credentials";
import {Session, SessionI} from "../boilerplate-common/shapes/session";
import {sessionTimeout} from "../boilerplate-common/util/constants";

let log = config.getConfiguredLog('session.service');

class SessionService {
  constructor() {}

  login(credentials: CredentialsI, context: ContextI): Promise<SessionI> {
    return new Promise<SessionI>( (resolve,reject)=> {
      userService.getAuthorizedUserByUserName(credentials.username, context)
        .then(user =>{
          if(user) {
            bcrypt.compare(credentials.password, user.hash)
              .then(matches => {
                if (matches) {
                  let secret = config.secret;
                  let jwt: string = sign({user: credentials.username}, secret, {algorithm: 'HS256'});
                  log.debug({debug: {username: credentials.username, jwt: jwt}}, 'User logged into context');

                  const session = new Session();
                  session.username = credentials.username;
                  session.token = jwt;
                  session.timestamp = Date.now();
                  session.context = context.name;
                  session.applicationRoles = user.applicationRoles;
                  sessionDao.createSession(session, context)
                    .then(success => {
                      if(success) {
                        resolve(session);
                      } else {
                        resolve (undefined);
                      }
                    }, err => {
                      log.error(err);
                      reject(err);
                    });
                } else {
                  resolve(undefined);
                }
              }, err => {
                log.error(err);
                reject(err);
              });
          } else {
            resolve(undefined);
          }
        }, err => {
          log.error(err);
          reject(err);
        });
    });
  }


  checkSession(token: string, context: ContextI): Promise<SessionI> {
    return new Promise<SessionI>((resolve, reject) => {
      sessionDao.getSession(token, context)
        .then(session => {
          if(session && (Date.now() - session.timestamp) <= sessionTimeout) {
              resolve(session);
          } else {
            resolve(undefined);
          }
        }, err => {
          log.error(err);
          reject(err);
        });
    });
  }
}

const sessionService = new SessionService();
export default sessionService;