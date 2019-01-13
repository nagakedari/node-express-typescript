
interface TrackedI {
  id: string;
  inserted: number;
  updated: number;
  updator: string;
}

class Tracked implements TrackedI {
  id: string;
  inserted: number;
  updated: number;
  updator: string;

  constructor(col?: TrackedI) {
    if (col) {
      this.id = col.id;
      this.inserted = col.inserted;
      this.updated = col.updated;
      this.updator = col.updator;
    }
  }
}

export {
  TrackedI,
  Tracked
};


