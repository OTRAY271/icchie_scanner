<template>
  <v-app>
    <div>
      <v-app-bar class="pl-sm-12" color="indigo" dark>
        <v-toolbar-title>
          <v-icon large color="blue lighten-5" class="mr-1">mdi-chart-bar</v-icon>
          <span class="mx-sm-3 font-weight-bold">いっちースキャナー</span>
          <span
            class="mx-1 caption font-weight-light grey--text text--lighten-2"
          >Icchie Scanner ver.β</span>
        </v-toolbar-title>
      </v-app-bar>
    </div>

    <v-card class="mt-6 mx-sm-12 pa-6">
      <v-card-text>
        <p class="title text--primary mb-n6">プリントを撮影してください。</p>
      </v-card-text>
      <v-card-actions>
        <v-col no-gutters>
          <v-row v-for="data in inputs" :key="data.id" rows="2">
            <v-file-input
              placeholder="追加..."
              prepend-icon="mdi-camera"
              @change="updateFileInput(data, $event)"
              ref="file"
              accept="image/*"
              :disabled="processing"
            ></v-file-input>
          </v-row>
          <v-row>
            <div class="ml-auto">
              <v-col>
                <v-row>
                  <v-switch
                    v-model="convert2pdf"
                    label="PDFに変換"
                    color="primary"
                    class="mr-4 mt-0"
                    :disabled="processing"
                  ></v-switch>
                  <v-switch
                    v-model="red_pen"
                    label="赤ペン"
                    color="primary"
                    class="ma-0"
                    :disabled="processing"
                  ></v-switch>
                </v-row>
              </v-col>
            </div>
          </v-row>
          <v-row>
            <v-btn
              v-if="!processing"
              :disabled="inputs.length === 1"
              :class="[ $vuetify.breakpoint.xs ? 'v-btn--block' : 'px-12 mx-auto' ]"
              @click="generate().then(() => {if(!convert2pdf)$vuetify.goTo($refs.img_card, {duration: 300,offset: 0,easing: 'easeInOutCubic',});});"
              x-large
            >作成</v-btn>
            <v-progress-circular v-else class="mt-4 mx-auto" indeterminate color="primary"></v-progress-circular>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>

    <v-card v-if="imgs.length > 0 && !processing" class="mt-3 mx-sm-12" ref="img_card">
      <v-container fluid>
        <v-row>
          <v-col v-for="(img, i) in imgs" :key="i" class="d-flex child-flex" cols="6">
            <v-card flat tile class="d-flex" :aspect-ratio="img.width/img.height">
              <img :src="img.data" class="grey lighten-2" width="100%" height="100%" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <v-sheet class="my-6 mx-sm-12 px-6 grey lighten-5 grey--text text--darken-1 body-2">
      ロイ〇ノートにアップする数学の演習プリントを、綺麗に撮影できる！ これはそんなサービスです。
      <br />
      <span class="font-weight-bold">※ 現時点ではベータ版です。不具合が発生するかもしれません。機能もまだ開発中。</span>
      <br />
      <br />
      <ul>
        <li>撮影したプリントを、影を消して綺麗にする（実装済）</li>
        <li>PDF形式で出力でき、ブラウザの機能で直接ロイ〇ノートに送れる（実装済）</li>
        <li>JPG形式でも出力できる（実装済）</li>
        <li>赤ペン対応（実装済・試験運用中）</li>
        <li>分かりやすいHow-to-use（実装予定）</li>
        <li>バグ報告フォーム（実装予定）</li>
        <li>自動トリミング機能（実装検討中）</li>
        <li>スマホだと×ボタンが押せない（既知の不具合）</li>
        <li>普通の写真を読み込ませると…（既知の不具合？）</li>
      </ul>
      <br />
      <div align="right">製作者／OTЯAY (1D)</div>
    </v-sheet>
  </v-app>
</template>

<script>
import jsPDF from "jspdf";
import Process from "./components/Process.js";
//import Process from "./components/opencvjs/opencv.js";
export default {
  name: "app",
  components: {},
  props: {},
  data() {
    return {
      lastest_input_id: 0,
      inputs: [{ id: 0, file: null }],
      processing: false,
      convert2pdf: true,
      red_pen: false,
      imgs: []
    };
  },
  methods: {
    updateFileInput(data, e) {
      if (e === null) {
        this.inputs = this.inputs.filter(function(item) {
          return item.id !== data.id;
        });
      } else {
        let index = 0;
        for (
          ;
          data.id !== this.inputs[index].id && index < this.inputs.length;
          index++
        );
        if (this.inputs[index].file === null) {
          this.inputs.push({ id: ++this.lastest_input_id, file: null });
        }
        this.inputs.splice(index, 1, {
          id: this.inputs[index].id,
          file: e
        });
      }
    },
    generate() {
      this.processing = true;
      var app = this;
      return new Promise(function(resolve) {
        let doc = new jsPDF();
        let promises = [];
        app.imgs = [];
        for (let i = 1; i < app.inputs.length - 1; i++) {
          doc.addPage();
          app.imgs.push({});
        }
        for (let i = 0; i < app.inputs.length - 1; i++) {
          let imgData = app.readFileAsync(app.inputs[i].file, i);
          promises[i] = imgData.then(function(data) {
            let inputbase64data = data[0]; // 入力したいbase64データ
            let process = new Process();
            let co_promise = process.process(inputbase64data, app.red_pen);
            return co_promise.then(function(canvas) {
              const MAX_WIDTH = doc.internal.pageSize.width; // 画像リサイズ後の横の長さの最大値
              const MAX_HEIGHT = doc.internal.pageSize.height; // 画像リサイズ後の縦の長さの最大値
              let width, height, ratio;
              if (canvas.width > canvas.height) {
                // 横長の画像は横のサイズを指定値にあわせる
                ratio = canvas.height / canvas.width;
                width = MAX_WIDTH;
                height = MAX_WIDTH * ratio;
              } else {
                // 縦長の画像は縦のサイズを指定値にあわせる
                ratio = canvas.width / canvas.height;
                width = MAX_HEIGHT * ratio;
                height = MAX_HEIGHT;
              }
              let base64 = canvas.toDataURL("image/jpeg");
              doc.setPage(data[1] + 1);
              doc.addImage(
                base64,
                "JPEG",
                MAX_WIDTH / 2 - width / 2,
                MAX_HEIGHT / 2 - height / 2,
                width,
                height
              );
              if (!app.convert2pdf)
                app.imgs.splice(data[1], 1, { data: base64, width, height });
              return co_promise;
            });
          });
        }
        Promise.all(promises).then(function() {
          app.processing = false;
          if (app.convert2pdf) doc.save("a4.pdf");
          resolve();
        });
      });
    },
    readFileAsync(file, i) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve([reader.result, i]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};
</script>
