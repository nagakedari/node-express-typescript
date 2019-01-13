import {TrackedDao} from './tracked.dao';
import {Stuff, StuffI} from "../boilerplate-common/shapes/stuff";

class StuffDao extends TrackedDao<StuffI> {
  constructor() {
    super('stuff', (shape)=>{return new Stuff(shape)}, ()=> {return {name: 1};});
  }
}

const stuffDao = new StuffDao();

export {
  StuffDao,
  stuffDao
};
