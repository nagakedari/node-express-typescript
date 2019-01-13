/**
 * Created by Franz on 4/30/2016.
 */
import * as express from 'express';
import {Router} from 'express';
import {config} from '../config/config';
import adminRouter from "./admin.router";
//import adminRouter from './adminRouter';

const log = config.getConfiguredLog('top.router');
log.info('Setup router');

let topRouter:Router = express.Router();

topRouter.use('/api/admin', adminRouter);

export default topRouter;
