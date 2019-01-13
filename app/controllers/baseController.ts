import * as _ from 'lodash';
import {Request, Response} from 'express';
import contextService from '../services/context.service';
import sessionService from '../services/session.service';
import {ContextI} from '../shapes/contexts';
import {Authorization, AuthorizationI} from '../shapes/authorization';
import {config} from '../config/config';
import {applicationContextKey, authorizationKey, jwtKey} from "../boilerplate-common/util/constants";
import {ApplicationRoleI, RoleType} from "../boilerplate-common/shapes/applicationRole";

const log = config.getConfiguredLog('BaseController');

abstract class BaseController {
  constructor() {}

  getClientAppContext(req: Request, res: Response): Promise<ContextI> {
    return new Promise<ContextI>( (resolve, reject) => {
      // Attempt to get context from header
      let applicationContext = req.get(applicationContextKey);
      if (!applicationContext || applicationContext.trim().length === 0) {
        // Attempt to get context from query
        applicationContext = req.query[applicationContextKey];
        if (!applicationContext || applicationContext.trim().length === 0) {
          // Attempt as path param from last part of path
          applicationContext = req.params[applicationContextKey];
        }
      }
      if (!applicationContext) {
        res.status(400).send({message: 'No application context'});
        resolve(undefined);
        return;
      }

      contextService.getContext(applicationContext)
        .then(context => {
          if (context) {
            resolve(context);
          } else {
            res.status(400).send({message: 'Invalid application context'});
            resolve(undefined);
          }
        }, err => {
          log.error(err);
          reject(err);
        });
    });
  }

  private getToken(req:Request): string {
    let token = req.get(authorizationKey);
    if(!token || token.trim().length === 0) {
      token = req.get(jwtKey);
      if (!token || token.trim().length === 0) {
        token = req.query[jwtKey];
      }
    }
    return token;
  }

  /**
   *
   * @param {e.Request} req
   * @param {Response} res
   * @param {RoleType} role
   * @param {string} application If applicationis provided it willa auhtorized against that.  Otherwise it looks
   * for application on the params.  So if the application is with respect to functionality of an admin tool like
   * bsh-admin, that should be passed in as a parameter or on the params.  But if its an authorization as to whether
   * it is good in the management of a specific application, then that should be passed or in the params.
   * @returns {Promise<{authorization: AuthorizationI; context: ContextI}>}
   */
  authorizeAndAuthenticate(req: Request, res: Response, role: RoleType, application?: string): Promise<{authorization: AuthorizationI, context: ContextI}> {
    return this.authenticate(req, res)
      .then(authorization => {
        if(authorization) {
          if(!application) {
            application = req.params.application;
          }
          if (this.authorize(res, application, role, authorization)) {
            return contextService.getContext(application)
              .then(context => {
                return {authorization: authorization, context: context};
              });
          } else {
            return Promise.resolve(undefined)
          }
        } else {
          return Promise.resolve(undefined);
        }
      });
  }

  private authorize(res: Response, application: string, role: RoleType, authorization: AuthorizationI): boolean {
    const applicationRole: ApplicationRoleI = _.find(authorization.session.applicationRoles, {application: application});
    if(!applicationRole) {
      res.status(401).send({message: 'Unauthorized'});
      return false;
    } else {
      return applicationRole.roles.indexOf(role) > -1;
    }
  }

  // TODO:  Place a token authentication in middleware ahead of routes but after login
  private authenticate(req: Request, res: Response): Promise<Authorization> {
    return new Promise<Authorization>( (resolve, reject) => {
      this.getClientAppContext(req, res)
        .then (appContext => {
          if(appContext) {
            const token = this.getToken(req);
            if(!token) {
              res.status(401).send({message: 'Unauthorized'});
              resolve(undefined);
            } else {
              sessionService.checkSession(token, appContext)
                .then(session => {
                  if (session) {
                    resolve(new Authorization(appContext, session));
                  } else {
                    res.status(401).send({message: 'Unauthorized'});
                    resolve(undefined)
                  }
                });
            }
          } else {
            // getClientAppContext has already responded
          }
        }, err =>{
          log.error(err);
          reject (err);
        });
    });
  }
}

export {
  BaseController
}