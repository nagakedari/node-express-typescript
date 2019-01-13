import * as _ from 'lodash';

const enum RoleType {
  Admin = 'Admin'
}

interface ApplicationRoleI {
  application: string;
  roles: RoleType[];
}

class ApplicationRole implements ApplicationRoleI {
  application: string;
  roles: RoleType[] = [];

  constructor(appRole?:ApplicationRoleI) {
    if (appRole) {
      this.application = appRole.application;
      _.each(appRole.roles, (role: RoleType) => {
        this.roles.push(role);
      });
    }
  }
}

export {
  RoleType,
  ApplicationRoleI,
  ApplicationRole
};
