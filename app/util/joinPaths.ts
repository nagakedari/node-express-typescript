import * as _ from 'lodash';
import * as urlJoin from 'url-join';

export function joinPaths(...args: string[]): string {
  let toJoin = _.filter(args, arg => {
    return arg !== undefined;
  });
  return urlJoin(...toJoin);
}
