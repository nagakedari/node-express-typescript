import contextService from '../services/context.service';
import {config} from '../config/config';
import adminService from '../services/admin.service';

const log = config.getConfiguredLog('bootstrapAWS');

contextService.getContexts()
.then(contexts => {
  log.info('Found ' + contexts.length + ' contexts');
  contexts.forEach(context => {
    const promises = [];
    //promises.push(adminService.createApplication(context));
    Promise.all(promises)
      .then(values => {
        log.info(values);
        process.exit(0);
      }, err => {
        log.error(err);
      });
  });
}, err => {
  log.error(err);
});