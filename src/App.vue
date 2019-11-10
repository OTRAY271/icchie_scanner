<template>
  <v-app>
    <div>
      <v-app-bar class="pl-sm-12" color="indigo" dark>
        <v-toolbar-title>いっちースキャナー</v-toolbar-title>
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
            ></v-file-input>
          </v-row>
          <v-row>
            <v-btn class="px-12 mt-4 mx-auto" @click="generate">作成</v-btn>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-app>
</template>

<script>
import jsPDF from "jspdf";
import Exif from "./components/Exif.js";
import Process from "./components/Process.js";
//import Process from "./components/opencvjs/opencv.js";
export default {
  name: "app",
  components: {},
  props: {},
  data() {
    return {
      lastest_input_id: 0,
      inputs: [{ id: 0, file: null }]
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
      console.log(this.inputs);
    },
    generate() {
      /*const elFile = this.inputs[1].file;
      const files = elFile.files;*/
      /*var imgData = this.ImageToBase64(
        this.readFileAsync(this.inputs[1].file),
        "image/jpeg"
      );*/
      /*var imgData = this.readFileAsync(this.inputs[1].file);
      var doc = new jsPDF();
      console.log(imgData);

      doc.addImage(imgData, "JPEG", 15, 40, 180, 160);
      doc.save("a4.pdf");*/
      let doc = new jsPDF();
      let process = new Process();
      let promises = [];
      for (let i = 1; i < this.inputs.length - 1; i++) doc.addPage();
      for (let i = 0; i < this.inputs.length - 1; i++) {
        let imgData = this.readFileAsync(this.inputs[i].file, i);
        promises[i] = imgData.then(function(data) {
          let inputbase64data = data[0]; // 入力したいbase64データ
          let exif = new Exif();
          let co_promise = exif.clearOrientation(inputbase64data);
          return co_promise.then(function(outputbase64data) {
            // outputbase64data: 横向きが直った画像base64データ
            // これを使って改めてcanvasを描画
            outputbase64data = process.process(outputbase64data);
            doc.setPage(data[1] + 1);
            doc.addImage(
              outputbase64data,
              "JPEG",
              0,
              0,
              doc.internal.pageSize.width,
              doc.internal.pageSize.height
            );
            return co_promise;
          });
        });
      }
      Promise.all(promises).then(function() {
        doc.save("a4.pdf");
      });
    },
    /*ImageToBase64(img, mime_type) {
      console.log(img);
      // New Canvas
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      // Draw Image
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      // To Base64
      return canvas.toDataURL(mime_type);
    },
    async getFileContent(file) {
      try {
        const content = await this.readFileAsync(file);
        this.content = content;
      } catch (e) {
        console.log(e);
      }
    },*/
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
    /*readFileAsync(files) {
      return new Promise((resolve, reject) => {
        files.forEach(function(file) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
    }*/
  }
};
</script>
