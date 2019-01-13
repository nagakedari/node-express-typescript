const maxImageSize = 20000000;
const osWindows = 'Windows_NT';


const multerLimits = {
  fieldNameSize: 100,
  fieldSize: 1000000,
  fields: 20,
  fileSize: maxImageSize,
  files: 20,
  parts: 2000020,
  headerPairs: 2000
};

const imageMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/gif'
];


export {
  maxImageSize,
  multerLimits,
  imageMimeTypes,
  osWindows
}