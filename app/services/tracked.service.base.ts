import {ContextI} from '../shapes/contexts';
import {TrackedDao} from '../dao/tracked.dao';
import {TrackedI} from "../boilerplate-common/shapes/tracked";

export abstract class TrackedServiceBase<T extends TrackedI> {
  constructor(protected dao: TrackedDao<T>, public instantiate: (T)=>T) {}

  getAll(context): Promise<T[]> {
    return this.dao.getAll(context);
  }

  get(id: string, context: ContextI): Promise<T> {
    return this.dao.getById(id, context);
  }

  getByKey(key: any, context: ContextI): Promise<T> {
    return this.dao.getByKey(key, context);
  }

  create(item: T, context:ContextI): Promise<T> {
    return this.dao.create(item, context)
      .then(id => {
        return this.get(id, context);
      });
  }

  save(item: T, context:ContextI): Promise<T> {
    return this.dao.save(item, context)
      .then(id => {
        return this.get(id, context);
      });
  }

  delete(id: string, context:ContextI): Promise<boolean> {
    return this.dao.delete(id, context);
  }
}