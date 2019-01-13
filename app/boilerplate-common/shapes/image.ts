
interface BaseImageI {
  name: string;
  width: number;
  height: number;
}

interface ThumbnailI extends BaseImageI {}

class Thumbnail implements ThumbnailI {
  name = '';
  width = 0;
  height = 0;

  constructor(thumbnail?: ThumbnailI) {
    if (thumbnail) {
      this.name = thumbnail.name;
      this.width = thumbnail.width;
      this.height = thumbnail.height;
    }
  }
}

interface ImageI extends BaseImageI {
  thumbnail?: ThumbnailI;
}

class Image implements ImageI {
  name = '';
  width = 0;
  height = 0;
  thumbnail: ThumbnailI;

  constructor(image?: ImageI) {
    if (image) {
      this.name = image.name;
      this.width = image.width;
      this.height = image.height;
      this.thumbnail = new Thumbnail(image.thumbnail);
    }
  }
}



export {
  BaseImageI,
  ThumbnailI,
  Thumbnail,
  ImageI,
  Image
};
