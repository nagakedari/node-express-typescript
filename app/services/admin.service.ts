import {ContextI} from '../shapes/contexts';
import {config} from '../config/config';

let log = config.getConfiguredLog('admin.service');

class AdminService {
  private _contexts: ContextI[];

  constructor() {}


}

const adminService = new AdminService();
export default adminService;