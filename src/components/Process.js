//https://qiita.com/mo49/items/a3d61d97f1883ead333bによる

export default class Process {
  process(imgDataURL, red_pen) {
    return new Promise(function(resolve) {
      let img = new Image();
      img.onload = function() {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        const MAX_WIDTH = 2048; // 画像リサイズ後の横の長さの最大値
        const MAX_HEIGHT = 2048; // 画像リサイズ後の縦の長さの最大値
        let width, height, ratio;
        if (img.width > img.height) {
          // 横長の画像は横のサイズを指定値にあわせる
          ratio = img.height / img.width;
          width = MAX_WIDTH;
          height = MAX_WIDTH * ratio;
        } else {
          // 縦長の画像は縦のサイズを指定値にあわせる
          ratio = img.width / img.height;
          width = MAX_HEIGHT * ratio;
          height = MAX_HEIGHT;
        }
        clearOrientation(imgDataURL, img, canvas, ctx, width, height);
        const mix_rate = 0.9;
        ctx.putImageData(
          cleanUp(
            ctx.getImageData(0, 0, canvas.width, canvas.height),
            13,
            9,
            mix_rate,
            red_pen
          ),
          0,
          0
        );
        noiseRejection(canvas);
        resolve(canvas);
      };
      img.src = imgDataURL;

      // exif情報のorientationを取得
    });
  }
}
function clearOrientation(imgDataURL, img, canvas, ctx, width, height) {
  let byteString = atob(imgDataURL.split(",")[1]);
  let orientaion = byteStringToOrientation(byteString);
  switch (orientaion) {
    case 3: //画像が１８０度回転している時
      canvas.width = width;
      canvas.height = height;
      ctx.rotate(Math.PI);
      ctx.drawImage(img, -width, -height, width, height);
      ctx.rotate(-Math.PI);
      break;
    case 6: //画像が時計回りに９０度回っている時
      canvas.width = height;
      canvas.height = width;
      ctx.rotate(Math.PI * 0.5);
      ctx.drawImage(img, 0, -height, width, height);
      ctx.rotate(-Math.PI * 0.5);
      break;
    case 8: //画像が反時計回りに９０度回っている時
      canvas.width = height;
      canvas.height = width;
      ctx.rotate(-Math.PI * 0.5);
      ctx.drawImage(img, -width, 0, width, height);
      ctx.rotate(Math.PI * 0.5);
      break;
    default:
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
  }
}
function byteStringToOrientation(img) {
  let head = 0;
  let orientation;
  let f = 1;
  while (f) {
    if ((img.charCodeAt(head) == 255) & (img.charCodeAt(head + 1) == 218)) {
      break;
    }
    if ((img.charCodeAt(head) == 255) & (img.charCodeAt(head + 1) == 216)) {
      head += 2;
    } else {
      let length = img.charCodeAt(head + 2) * 256 + img.charCodeAt(head + 3);
      let endPoint = head + length + 2;
      if ((img.charCodeAt(head) == 255) & (img.charCodeAt(head + 1) == 225)) {
        let segment = img.slice(head, endPoint);
        let bigEndian = segment.charCodeAt(10) == 77;
        let count;
        if (bigEndian) {
          count = segment.charCodeAt(18) * 256 + segment.charCodeAt(19);
        } else {
          count = segment.charCodeAt(18) + segment.charCodeAt(19) * 256;
        }
        for (let i = 0; i < count; i++) {
          let field = segment.slice(20 + 12 * i, 32 + 12 * i);
          if (
            (bigEndian && field.charCodeAt(1) == 18) ||
            (!bigEndian && field.charCodeAt(0) == 18)
          ) {
            orientation = bigEndian ? field.charCodeAt(9) : field.charCodeAt(8);
          }
        }
        break;
      }
      head = endPoint;
    }
    if (head > img.length) {
      break;
    }
  }
  return orientation;
}
function noiseRejection(canvas) {
  let iplImage = window.cvGetIplImageAtCanvasElement(canvas);
  let newIplImage = window.cvCloneImage(iplImage);
  window.cvSmooth(iplImage, newIplImage, window.CV_SMOOTH_TYPE.MEDIAN, 3, 3);
  window.cvShowImageToCanvasElement(canvas, newIplImage);
}
//https://qiita.com/yukatayu/items/620d1159f201c99f5d64 による
function cleanUp(data, size_, c_, mix_rate, red_pen) {
  let size = size_ || 7;
  let c = c_ || 2;
  let d = parseInt((size - 1) / 2);
  let h = data.height;
  let w = data.width;
  let src = new Array(h * w * 4).fill(255);
  for (let i = 0; i < h * w * 4; ++i) src[i] = data.data[i];
  let n = size * size;
  let lum = [0.298912, 0.586611, 0.114478]; //輝度計算用の係数
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      let t = 0;
      for (let y1 = y - d; y1 <= y + d; ++y1) {
        for (let x1 = x - d; x1 <= x + d; ++x1) {
          let i = (y1 * w + x1) * 4;
          t +=
            0 <= x1 && x1 < w && 0 <= y1 && y1 < h
              ? src[i++] * lum[0] + src[i++] * lum[1] + src[i++] * lum[2]
              : 0;
        }
      }
      let i = (y * w + x) * 4;
      let hsv = rgb2hsv([src[i], src[i + 1], src[i + 2]]);
      let flag = (hsv[0] <= 26 || hsv[0] >= 340) && hsv[1] > 20;
      if (red_pen && flag) {
        data.data[i] = src[i] * 0.8 + 255 * 0.2;
        data.data[i + 1] = src[i + 1] * 0.8;
        data.data[i + 2] = src[i + 2] * 0.8;
      } else {
        let result;
        if (
          src[i] * lum[0] + src[i + 1] * lum[1] + src[i + 2] * lum[2] <
          t / n - c
        ) {
          result = 0;
        } else {
          result = 255;
        }
        data.data[i] = data.data[i + 1] = data.data[i + 2] =
          result * mix_rate +
          (src[i] * lum[0] + src[i + 1] * lum[1] + src[i + 1] * lum[2]) *
            (1 - mix_rate);
      }
    }
  }
  return data;
}
function rgb2hsv(rgb) {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let diff = max - min;

  let h = 0;

  switch (min) {
    case max:
      h = 0;
      break;

    case r:
      h = 60 * ((b - g) / diff) + 180;
      break;

    case g:
      h = 60 * ((r - b) / diff) + 300;
      break;

    case b:
      h = 60 * ((g - r) / diff) + 60;
      break;
  }

  let s = max == 0 ? 0 : diff / max;
  let v = max;

  return [h, s * 100, v * 100];
}
