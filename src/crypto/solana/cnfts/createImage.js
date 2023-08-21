import path from 'path';
import sharp from 'sharp';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function overlayImages(imagePaths, outputPath) {
    const baseImage = sharp(imagePaths[0]);
    const overlays = imagePaths.slice(1).map(imagePath => ({ input: imagePath }));

    await baseImage.composite(overlays).toFile(outputPath);
}

export async function createNFT(attributes, outputPath) {
    const attributeBasePath = path.join(__dirname, 'attributes');

    const imagePaths = Object.entries(attributes).map(([attribute, value]) => {
        return path.join(attributeBasePath, attribute, `${value}.png`);
    });

    await overlayImages(imagePaths, outputPath);
    return outputPath;
}

