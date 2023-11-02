const { parentPort, workerData } = require('worker_threads');
const Jimp = require('jimp');

const filename = workerData.filename;

const addBlurToImage = async () => {
  try {
    const image = await Jimp.read('./cdn/' + filename);
    image.blur(8);
    image.brightness(-0.2);
    image.quality(60);
    await image.writeAsync('./cdn/' + filename);
    parentPort.postMessage('complete');
  } catch (error) {
    console.error(error);
    parentPort.postMessage('An error occurred while processing the image.');
  }
};

addBlurToImage();