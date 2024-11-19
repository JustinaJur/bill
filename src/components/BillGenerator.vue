<template>
  <div class="bill-generator">
    <h1>{{ msg }}</h1>
    <div>
      <div class="bill-generator_input-fields">
        <label>Vardas Pavardė</label>
        <input type="input" placeholder="Vardas Pavardė" v-model="fullName" />
        <label>Sąskaitos numeris</label>
        <input
          type="input"
          placeholder="Sąskaitos numeris"
          v-model="accountNumber"
        />
        <label>Sąskaitos data</label>
        <input type="date" v-model="selectedDate" />
        <label>Pamokos kaina</label>
        <input type="number" v-model="price" />
        <input type="file" @change="getExcelextractedExcelData" />
      </div>
      <button
        class="cosmic-button"
        @click="this.generatePDF(), (isPDFLoading = true)"
        :disabled="
          isPDFLoading ||
          bodyExcel == null ||
          accountNumber == null ||
          fullName == null
        "
      >
        {{ isPDFLoading ? "Generuojami PDF" : "Gauti PDF" }}
      </button>
    </div>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import readXlsxFile from "read-excel-file";
import "jspdf-autotable";

import { getCurrentYearAndMonth, getCurrrentDate } from "@/helpers/date.js";
import { loadFonts } from "@/helpers/fonts.js";
import { createObjectsFromTwoArrays } from "@/helpers/dataTransformations.js";
import { headersTable } from "@/constants.js";

export default {
  name: "bill-generator",
  props: {
    msg: String,
  },
  data() {
    return {
      headersExcel: null,
      bodyExcel: null,
      isPDFLoading: false,
      fileName: null,
      selectedDate: null,
      fullName: null,
      accountNumber: null,
      price: 50,
    };
  },
  created() {
    this.selectedDate = getCurrrentDate();
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
          })
          .catch((error) => {
            alert("Netinkamas pdf formatas:", error);
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
      const {
        selectedDate = "",
        fullName = "",
        accountNumber = "",
      } = this.$data || {};

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
      doc.text(selectedDate, 105, 32, null, null, "center");

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
      doc.text(fullName, leftAlignment, 66);
      doc.text("Sąskaita AB „Swedbank“", leftAlignment, 72);
      doc.text(accountNumber, leftAlignment, 78);
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
      let { bodyExcel, price } = this;

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
        console.log(person);
        let { amount, parent } = person;
        // logData.generatedPDFData.push({ person, amount });

        this.generatePersonalInfo(doc, person);
        const bodyTable = this.generateBodyTable(Number(amount), price);

        doc.autoTable(this.generateTableValues(headersTable, bodyTable));
        doc.save(`Sąskaita_${parent}.pdf`);
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
.bill-generator {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
}

.bill-generator_input-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.bill-generator_input-fields label {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.bill-generator_input-fields input {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px; /* Rounded corners for inputs */
  outline: none;
}

.bill-generator_input-fields input:focus {
  border-color: #007bff; /* Highlight the input on focus */
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Focus effect */
}

.bill-generator input[type="file"],
.bill-generator button {
  margin-bottom: 10px; /* Adds spacing between the input and button */
  width: 100%; /* Make the input and button take full width, but only up to the width of the container */
  max-width: 300px; /* Limits the width of the input and button */
}

.bill-generator button {
  cursor: pointer;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  margin: 10px;
}

.bill-generator button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.cosmic-button {
  position: relative;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  border: 2px solid transparent;
  border-radius: 8px;
  background: linear-gradient(135deg, #8e2de2, #4a00e0);
  color: #fff;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2), 0 0 25px rgba(72, 61, 139, 0.5);
}

.cosmic-button:hover {
  background: linear-gradient(135deg, #4a00e0, #8e2de2); /* Hover effect */
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.4), 0 0 40px rgba(72, 61, 139, 0.7);
}

.cosmic-button:focus {
  outline: none;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(72, 61, 139, 1);
}
</style>
