<template>
  <div class="billGenerator">
    <h1>{{ msg }}</h1>
    <div>
      <input type="file" @change="getExcelFiletableData" />
      <button @click="generatePDF">download PDF</button>
    </div>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import readXlsxFile from "read-excel-file";
import "jspdf-autotable";

import { callAddFont } from "@/assets/fonts/ARIALUNI-normal.js";
import { callAddFontBold } from "@/assets/fonts/Arial Unicode MS Bold-bold.js";

export default {
  name: "BillGenerator",
  props: {
    msg: String,
  },
  data() {
    return {
      headers: null,
      tableData: [],
    };
  },
  methods: {
    getExcelFiletableData(event) {
      let xlsxfile = event.target.files ? event.target.files[0] : null;
      readXlsxFile(xlsxfile).then((filetableData) => {
        this.transformExceltableData(filetableData);
      });
    },
    transformExceltableData(exceltableData) {
      this.headers = exceltableData[0];
      this.tableData = exceltableData.slice(1).map((row) => {
        return this.headers.map((header, index) => {
          return {
            [header]: row[index],
            content: row[index],
          };
        });
      });
    },
    getCurrrentDate() {
      const dateObj = new Date();
      const month = dateObj.getUTCMonth() + 1;
      const day = dateObj.getUTCDate();
      const year = dateObj.getUTCFullYear();

      const pMonth = month.toString().padStart(2, "0");
      const pDay = day.toString().padStart(2, "0");
      const currentPaddedDate = `${year}-${pMonth}-${pDay}`;
      return currentPaddedDate;
    },
    addBillingtableData(doc, billingtableData) {
      const { Vardas, Pavarde, Vaikas, email } = billingtableData;
      doc.setFont("Arial Unicode MS Bold", "bold");

      doc.setFontSize(12);
      doc.text("SĄSKAITA FAKTŪRA", 105, 20, null, null, "center");
      doc.text("Serija MED. Nr. 23-09-108", 105, 26, null, null, "center");
      doc.setFont("Arialuni", "normal");
      doc.text(this.getCurrrentDate(), 105, 32, null, null, "center");

      const rightAligment = 195;
      const leftAlignment = 14;

      doc.setFont("Arial Unicode MS Bold", "bold");
      doc.text("Pirkėja", rightAligment, 60, null, null, "right");
      doc.setFont("Arialuni", "normal");
      doc.text(
        `${Vardas} ${Pavarde} (${Vaikas})`,
        rightAligment,
        66,
        null,
        null,
        "right"
      );
      doc.text(`El. p. ${email}`, rightAligment, 72, null, null, "right");

      doc.setFont("Arial Unicode MS Bold", "bold");
      doc.text("Pardavėja", leftAlignment, 60);
      doc.setFont("Arialuni", "normal");
      doc.text("R J R", leftAlignment, 66);
      doc.text("Sąskaita AB „Swedbank“", leftAlignment, 72);
      doc.text("Sąskaitos numeris", leftAlignment, 78);
    },
    transfromArrayOfObjectsIntoObject(arr) {
      const object = arr.reduce((acc, current) => {
        return { ...acc, ...current };
      }, {});
      return object;
    },
    async generatePDF() {
      await jsPDF.API.events.push(["addFonts", callAddFont]);
      await jsPDF.API.events.push(["addFonts", callAddFontBold]);

      const doc = new jsPDF();

      let { headers, tableData } = this;

      tableData.forEach((row, index) => {
        const billingtableData = this.transfromArrayOfObjectsIntoObject(row);
        this.addBillingtableData(doc, billingtableData);

        // remove first 4 elements of headers
        var head = [headers.slice(4)];
        // remove first 4 elements of each row
        var body = [row.slice(4)];

        let finalSum = row.find((item) => item["Suma"]).Suma;
        let lastRows = [
          {
            content: "Viso",
            colSpan: 4,
            halign: "left",
          },
          {
            content: `${finalSum}`,
            colSpan: 1,
            halign: "left",
          },
        ];

        body.push(lastRows);

        doc.autoTable({
          head,
          body,
          startY: 90,
          theme: "plain",
          styles: {
            halign: "left",
            lineWidth: 0.2,
            lineColor: "#000000",
            cellPadding: 2,
            fontSize: 12,
          },
          headStyles: {
            font: "Arial Unicode MS Bold",
            fontStyle: "bold",
          },
          bodyStyles: {
            fontSize: 12,
            font: "Arialuni",
          },
        });

        index + 2 <= tableData.length ? doc.addPage() : null;
      });

      doc.save(`Sąskaitos_${this.getCurrrentDate()}.pdf`);
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
