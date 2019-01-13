import * as _ from 'lodash';
import {ContextI} from '../shapes/contexts';
import {config, StorageType} from '../config/config';
import contextDao from '../dao/context.dao';

let log = config.getConfiguredLog('context.service');

// TODO: Merge with config?
class ContextService {
    private _contexts: ContextI[];
    // This is the root context that gets all other contexts, so if we want to change the root, we have to refactor
    // this to something that can be altered externally
    private defaultContext: ContextI = {name: 'AdminConsole', mongoDatabase: 'adminconsole'};

    constructor() {
        this.getContexts(this.defaultContext);
    }

    // TODO:  Move to config
    static getImagesPath(context: ContextI): string {
        return ContextService.getRuntimStorageRootPath(context) + 'images/';
    }

    // TODO: Move to config
    private static getRuntimStorageRootPath(context: ContextI): string {
      if(config.storageType === StorageType.local) {
        return '/api/';
      } else if (config.storageType === StorageType.s3) {
        return 'http://' + context.domain + '.s3.amazonaws.com/';
      }
    }

    getContext(context: string): Promise<ContextI> {
        return new Promise<ContextI>( (resolve,reject) => {
            if(!context) {
                resolve(undefined);
            } else {
                this.getContexts(this.defaultContext)
                    .then(contexts => {
                        resolve(_.find(contexts, {name: context}))
                    }, err => {
                        log.error(err);
                        reject(err);
                    });
            }
        });
    }

    getContexts(context?: ContextI): Promise<ContextI[]> {
        let useContext = context;
        if(!useContext) {
            useContext = this.defaultContext;
        }
        return new Promise<ContextI[]>( (resolve,reject) => {
            if (this._contexts) {
                resolve(this._contexts)
            } else {
                contextDao.getContexts(useContext)
                    .then(contexts => {
                        this._contexts = contexts;
                        resolve(this._contexts)
                    }, err => {
                        log.error(err);
                        reject(err);
                    })
            }
        });
    }
}

const contextService = new ContextService();
export default contextService;
export {
    ContextService
};