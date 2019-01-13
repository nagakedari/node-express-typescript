import {AwsBase} from './awsBase';
import * as AWS from 'aws-sdk';
import {config} from '../../config/config';
import {ListBucketsOutput} from 'aws-sdk/clients/s3';
import * as readChunk from 'read-chunk';
import {maxImageSize} from '../../util/constants';


const log = config.getConfiguredLog('s3.service');

const s3 = new AWS.S3(/* configuration */);

class S3Service extends AwsBase {
  constructor() {
    super();
  }

  createBucket(name:string): Promise<boolean> {
    const promise = s3.createBucket({Bucket: name}).promise();
    return promise
      .then( ret => {
        log.info(ret,'Created bucket ' + name);
        return true;
      }, err => {
        log.error(err,'Error creating bucket ' + name);
        throw err;
      });
  }

  listBuckets(): Promise<boolean> {
    let promise = s3.listBuckets().promise();
    return promise
      .then((output:ListBucketsOutput) => {
        log.info(output,'List Buckets');
        return true;
      });
  }

  checkBucket(domain: string, key:string): Promise<boolean> {
    const query = {Bucket: domain, Key: key};
    log.info(query, 'Checking S3');
    const promise = s3.getObject(query).promise();
    return promise
      .then(data => {
        log.info(query, 'S3 Object found');
        return true;
      }, err => {
        log.error(query, 'S3 Object not found');
        log.error(err);
        return false;
      });
  }

  uploadFile(path:string, domain:string, key:string): Promise<boolean> {
    return readChunk(path, 0, maxImageSize)
      .then(buffer => {
        const params = {
          ACL: 'public-read',
          Body: buffer,
          Bucket: domain,
          Key: key
        };
        const promise = s3.putObject(params).promise();
        return promise.then(data => {
          return true;
        });
      });
  }

  deleteObject(domain:string, key:string): Promise<boolean> {
    return s3.deleteObject({Bucket: domain, Key: key}).promise()
      .then(data => {
        return true;
      });
  }
}

const s3Service = new S3Service();
export default s3Service;
