import { AssetTypeEnum, type AssetFaceResponseDto, type PersonResponseDto, ThumbnailFormat, api } from '@api';

export const searchNameLocal = (
  name: string,
  people: PersonResponseDto[],
  slice: number,
  personId?: string,
): PersonResponseDto[] => {
  return name.indexOf(' ') >= 0
    ? people
        .filter((person: PersonResponseDto) => {
          if (personId) {
            return person.name.toLowerCase().startsWith(name.toLowerCase()) && person.id !== personId;
          } else {
            return person.name.toLowerCase().startsWith(name.toLowerCase());
          }
        })
        .slice(0, slice)
    : people
        .filter((person: PersonResponseDto) => {
          const nameParts = person.name.split(' ');
          if (personId) {
            return (
              nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase())) &&
              person.id !== personId
            );
          } else {
            return nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase()));
          }
        })
        .slice(0, slice);
};

export const getPersonNameWithHiddenValue = (name: string, isHidden: boolean) => {
  return `${name ? name + (isHidden ? ' ' : '') : ''}${isHidden ? '(hidden)' : ''}`;
};

export const zoomImageToBase64 = async (
  face: AssetFaceResponseDto,
  photoViewer: HTMLImageElement | null,
  assetType: AssetTypeEnum,
  assetId: string,
): Promise<string | null> => {
  let image: HTMLImageElement | null = null;
  if (assetType === AssetTypeEnum.Image) {
    image = photoViewer;
  } else if (assetType === AssetTypeEnum.Video) {
    const data = await api.getAssetThumbnailUrl(assetId, ThumbnailFormat.Webp);
    const img: HTMLImageElement = new Image();
    img.src = data;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    image = img;
  }
  if (image === null) {
    return null;
  }
  const { boundingBoxX1: x1, boundingBoxX2: x2, boundingBoxY1: y1, boundingBoxY2: y2 } = face;

  const coordinates = {
    x1: (image.naturalWidth / face.imageWidth) * x1,
    x2: (image.naturalWidth / face.imageWidth) * x2,
    y1: (image.naturalHeight / face.imageHeight) * y1,
    y2: (image.naturalHeight / face.imageHeight) * y2,
  };

  const faceWidth = coordinates.x2 - coordinates.x1;
  const faceHeight = coordinates.y2 - coordinates.y1;

  const faceImage = new Image();
  faceImage.src = image.src;

  await new Promise((resolve) => {
    faceImage.onload = resolve;
    faceImage.onerror = () => resolve(null);
  });

  const canvas = document.createElement('canvas');
  canvas.width = faceWidth;
  canvas.height = faceHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(faceImage, coordinates.x1, coordinates.y1, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);

    return canvas.toDataURL();
  } else {
    return null;
  }
};
