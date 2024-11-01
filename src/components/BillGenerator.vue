<template>
  <div class="billGenerator">
    <h1>{{ msg }}</h1>
    <div>
      <!-- <form> -->
      <input type="file" @change="getFileData" />
      <!-- <button @click="downloadPDF">download PDF</button> -->
      <!-- </form> -->

      <button @click="downloadPDF">download PDF</button>
    </div>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import readXlsxFile from "read-excel-file";

export default {
  name: "BillGenerator",
  props: {
    msg: String,
  },
  data() {
    return {
      headers: null,
      data: [],
    };
  },
  methods: {
    getFileData(event) {
      let xlsxfile = event.target.files ? event.target.files[0] : null;
      readXlsxFile(xlsxfile).then((rows) => {
        this.headers = rows[0];
        this.data = rows.splice(1);
      });
    },
    createText(doc) {
      const date = new Date();
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      let currentDate = `${year}-${month}-${day}`;

      doc.setFont("PTSans", "normal");
      doc.text("SĄSKAITA FAKTŪRA", 105, 20, null, null, "center");
      doc.text("Serija MED. Nr. 23-09-108", 105, 30, null, null, "center");
      doc.text(currentDate, 105, 40, null, null, "center");

      doc.text("Pirkėja", 200, 80, null, null, "right");
      doc.text("Vardas Pavarde vaiko vardas", 200, 90, null, null, "right");
      doc.text("email", 200, 100, null, null, "right");

      doc.text("Pardavėja", 20, 80);
      doc.text("Vardas Pavarde", 20, 90);
      doc.text("Sąskaita banke", 20, 100);
      doc.text("Sąskaitos numeris", 20, 110);
    },
    downloadPDF() {
      const doc = new jsPDF();

      let { headers, data } = this;

      for (var j = 0; j < this.data.length; j++) {
        let rows = {};
        for (let i = 0; i < headers.length; i++) {
          this.createText(doc);

          rows[headers[i]] = data[j][i];
        }
        console.log("ffff");

        doc.table(20, 120, [rows], headers, { autoSize: true });
        doc.addPage();
      }

      doc.save("hello.pdf");
    },
  },
};
</script>

<style scoped>
.billGenerator {
  display: flex;
  flex-direction: column;
}
</style>
