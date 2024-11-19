<template>
  <div class="billGenerator">
    <h1>{{ msg }}</h1>
    <div>
      <input type="file" @change="getExcelextractedExcelData" />
      <button @click="generatePDF" :disabled="isPDFLoading">
        {{ isPDFLoading ? "Generuojami PDF" : "gauti PDF" }}
      </button>
    </div>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import readXlsxFile from "read-excel-file";
import "jspdf-autotable";

import { getCurrrentDate, getCurrentYearAndMonth } from "@/helpers/date.js";
import { loadFonts } from "@/helpers/fonts.js";
import { createObjectsFromTwoArrays } from "@/helpers/dataTransformations.js";
import { headersTable } from "@/constants.js";

export default {
  name: "BillGenerator",
  props: {
    msg: String,
  },
  data() {
    return {
      headersExcel: null,
      bodyExcel: null,
      isPDFLoading: false,
    };
  },
  created() {
    loadFonts();
  },
  methods: {
    getExcelextractedExcelData(event) {
      let { headersExcel } = this;
      let xlsxfile = event.target.files ? event.target.files[0] : null;

      if (xlsxfile) {
        readXlsxFile(xlsxfile)
          .then((extractedExcelData) => {
            headersExcel = extractedExcelData[0];
            let body = extractedExcelData.slice(1);
            this.bodyExcel = createObjectsFromTwoArrays(headersExcel, body);

            xlsxfile = null;
          })
          .catch((error) => {
            console.error("Error reading Excel file:", error);
          });
      }
    },
    generateTableValues(head, body) {
      return {
        head: [head],
        body: body,
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
      };
    },
    generatePersonalInfo(doc, person) {
      const { parent, no, email } = person;
      doc.setFont("Arial Unicode MS Bold", "bold");

      doc.setFontSize(12);
      doc.text("SĄSKAITA FAKTŪRA", 105, 20, null, null, "center");
      doc.text(
        `Serija MED. Nr. ${getCurrentYearAndMonth()}-${no}`,
        105,
        26,
        null,
        null,
        "center"
      );
      doc.setFont("Arialuni", "normal");
      doc.text(getCurrrentDate(), 105, 32, null, null, "center");

      const rightAligment = 195;
      const leftAlignment = 14;

      doc.setFont("Arial Unicode MS Bold", "bold");
      doc.text("Pirkėja", rightAligment, 60, null, null, "right");
      doc.setFont("Arialuni", "normal");
      doc.text(`${parent}`, rightAligment, 66, null, null, "right");
      doc.text(`El. p. ${email}`, rightAligment, 72, null, null, "right");

      doc.setFont("Arial Unicode MS Bold", "bold");
      doc.text("Pardavėja", leftAlignment, 60);
      doc.setFont("Arialuni", "normal");
      doc.text("R J R", leftAlignment, 66);
      doc.text("Sąskaita AB „Swedbank“", leftAlignment, 72);
      doc.text("Sąskaitos numeris", leftAlignment, 78);
    },
    generateBodyTable(amount, price) {
      return [
        [
          {
            content: "Anglų k. pamokėlės",
            halign: "left",
          },
          {
            content: "Vnt.",
            halign: "left",
          },
          // kiekis
          {
            content: `${amount}`,
            halign: "left",
          },
          // kaina
          {
            content: `${price}`,
            halign: "left",
          },
          // suma
          {
            content: `${amount * price}`,
            halign: "left",
          },
        ],
        [
          {
            content: "Viso",
            colSpan: 4,
            halign: "left",
          },
          {
            content: `${amount * price}`,
            colSpan: 1,
            halign: "left",
          },
        ],
      ];
    },
    async generatePDF() {
      let doc = await new jsPDF();
      this.isPDFLoading = true;
      let { bodyExcel } = this;
      let price = 30;

      // let logData = {
      //   // Logging props and data
      //   props: this.$props,
      //   data: this.$data,
      //   price,
      //   headersExcel: this.headersExcel,
      //   bodyExcel: this.bodyExcel,
      //   generatedPDFData: [],
      // };

      bodyExcel.forEach((person, index) => {
        let { amount, parent } = person;
        amount = Number(amount);

        // logData.generatedPDFData.push({ person, amount });

        this.generatePersonalInfo(doc, person);
        const bodyTable = this.generateBodyTable(amount, price);

        doc = doc.autoTable(this.generateTableValues(headersTable, bodyTable));

        // logData.generatedPDFData[index].bodyTable = bodyTable;
        index >= 1 ? null : doc.save(`Sąskaita_${parent}.pdf`);
      });
      this.isPDFLoading = false;

      // console.log("Component Data (this.$data):", this.$data);
      // console.log("Component Props (this.$props):", this.$props);
      // // Log all variables and props after PDF generation
      // console.log("All variables at the end of execution:", logData);
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
