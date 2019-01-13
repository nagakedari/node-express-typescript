import * as _ from 'lodash';
import {ApplicationRole, ApplicationRoleI} from './applicationRole';


interface SessionI {
  username: string;
  token: string;
  timestamp: number;
  context: string;
  applicationRoles: ApplicationRoleI[];
}

class Session implements SessionI {
  username: string;
  token: string;
  timestamp: number;
  context: string;
  applicationRoles: ApplicationRoleI[] = [];

  constructor (session?: SessionI) {
    if (session) {
      this.token = session.token;
      this.timestamp = session.timestamp;
      this.context = session.context;
      session.applicationRoles.forEach(applicationRole => {
        this.applicationRoles.push(new ApplicationRole(applicationRole));
      });
    }
  }
}

export {
  SessionI,
  Session
};
