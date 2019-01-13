import {Image, ImageI} from './image';
import {Tracked, TrackedI} from './tracked';

interface StuffI extends TrackedI {
  name?: string;
  canDoThings?: boolean;
  categories?: string[];
  image?: ImageI;
}

class Stuff extends Tracked implements StuffI {
  name: string;
  canDoThings: boolean;
  categories: string[] = [];
  image: ImageI;

  constructor(stuff?: StuffI) {
    super(stuff);
    if (stuff) {
      this.name = stuff.name;
      this.canDoThings = stuff.canDoThings;
      if (stuff.categories) {
        stuff.categories.forEach(category => {
          this.categories.push(category);
        });
      }
      this.image = new Image(stuff.image);
    }
  }
}

export {
  StuffI,
  Stuff
};
