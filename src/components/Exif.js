//https://qiita.com/mo49/items/a3d61d97f1883ead333bによる

export default class Exif {
  clearOrientation(imgDataURL) {
    return new Promise(function(resolve) {
      var byteString = atob(imgDataURL.split(",")[1]);
      var orientaion = new Exif().byteStringToOrientation(byteString);

      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        switch (orientaion) {
          case 3: //画像が１８０度回転している時
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.rotate(Math.PI);
            ctx.drawImage(img, -img.width, -img.height);
            ctx.rotate(-Math.PI);
            break;
          case 6: //画像が時計回りに９０度回っている時
            canvas.width = img.height;
            canvas.height = img.width;
            ctx.rotate(Math.PI * 0.5);
            ctx.drawImage(img, 0, -img.height);
            ctx.rotate(-Math.PI * 0.5);
            break;
          case 8: //画像が反時計回りに９０度回っている時
            canvas.width = img.height;
            canvas.height = img.width;
            ctx.rotate(-Math.PI * 0.5);
            ctx.drawImage(img, -img.width, 0);
            ctx.rotate(Math.PI * 0.5);
            break;
          default:
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.src = imgDataURL;

      // exif情報のorientationを取得
    });
  }

  byteStringToOrientation(img) {
    var head = 0;
    var orientation;
    let f = 1;
    while (f) {
      if ((img.charCodeAt(head) == 255) & (img.charCodeAt(head + 1) == 218)) {
        break;
      }
      if ((img.charCodeAt(head) == 255) & (img.charCodeAt(head + 1) == 216)) {
        head += 2;
      } else {
        let length = img.charCodeAt(head + 2) * 256 + img.charCodeAt(head + 3);
        var endPoint = head + length + 2;
        if ((img.charCodeAt(head) == 255) & (img.charCodeAt(head + 1) == 225)) {
          var segment = img.slice(head, endPoint);
          var bigEndian = segment.charCodeAt(10) == 77;
          var count;
          if (bigEndian) {
            count = segment.charCodeAt(18) * 256 + segment.charCodeAt(19);
          } else {
            count = segment.charCodeAt(18) + segment.charCodeAt(19) * 256;
          }
          for (var i = 0; i < count; i++) {
            var field = segment.slice(20 + 12 * i, 32 + 12 * i);
            if (
              (bigEndian && field.charCodeAt(1) == 18) ||
              (!bigEndian && field.charCodeAt(0) == 18)
            ) {
              orientation = bigEndian
                ? field.charCodeAt(9)
                : field.charCodeAt(8);
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
}
