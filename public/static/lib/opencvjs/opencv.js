let OPENCVJS_PATH = "static/lib/opencvjs/";

loadscript("module/core.js");
loadscript("module/imgcodecs.js");
loadscript("module/imgproc.js");
loadscript("module/ml.js");
loadscript("module/highgui.js");
loadscript("module/00_develop.js");

function loadscript(path) {
  let script = document.createElement("script");
  script.src = OPENCVJS_PATH + path;
  let head = document.getElementsByTagName("head");
  head[0].appendChild(script);
}
/*
//外部jsの読み込み
document.write(
  '<script type="text/javascript" charset="UTF-8" src="' +
    OPENCVJS_PATH +
    'module/core.js"></script>'
);
document.write(
  '<script type="text/javascript" charset="UTF-8" src="' +
    OPENCVJS_PATH +
    'module/imgcodecs.js"></script>'
);
document.write(
  '<script type="text/javascript" charset="UTF-8" src="' +
    OPENCVJS_PATH +
    'module/imgproc.js"></script>'
);
document.write(
  '<script type="text/javascript" charset="UTF-8" src="' +
    OPENCVJS_PATH +
    'module/ml.js"></script>'
);
document.write(
  '<script type="text/javascript" charset="UTF-8" src="' +
    OPENCVJS_PATH +
    'module/highgui.js"></script>'
);

//開発中メソッド
document.write(
  '<script type="text/javascript" charset="UTF-8" src="' +
    OPENCVJS_PATH +
    'module/00_develop.js"></script>'
);

//test用メソッド
document.write(
  '<script type="text/javascript" charset="UTF-8" src="' +
    OPENCVJS_PATH +
    'module/test.js"></script>'
);
*/
//メモ
//imgタグの画像から直接IplImage型へは変換できない
//ローカルの画像ファイルはクロスドメイン扱いとなりjavascriptのエラーが出る
