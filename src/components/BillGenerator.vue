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
        <input type="date" v-model="invDate" />
        <label>Už laikotarpį</label>
        <input type="month" v-model="serviceYearAndMonth" />
        <label>Pamokos kaina</label>
        <input type="number" v-model="price" />
        <input
          type="file"
          ref="fileInput"
          @change="getExcelextractedExcelData"
        />
      </div>
      <button
        class="cosmic-button"
        @click="this.generatePDF(), (this.isLoading = true)"
        :disabled="
          excelBody == null || accountNumber == null || fullName == null
        "
      >
        Gauti PDF
      </button>
    </div>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import readXlsxFile from "read-excel-file";
import "jspdf-autotable";
import { getCurrrentDate, getPreviousMonth } from "@/helpers/date.js";
import { loadFonts } from "@/helpers/fonts.js";
import { createObjectsFromTwoArrays } from "@/helpers/dataTransformations.js";
import { tableHeaders } from "@/constants.js";

export default {
  name: "bill-generator",
  props: {
    msg: String,
  },
  data() {
    return {
      excelHeaders: null,
      excelBody: null,
      fileName: null,
      invDate: null,
      fullName: null,
      accountNumber: null,
      price: 6,
      serviceYearAndMonth: null,
    };
  },
  created() {
    this.invDate = getCurrrentDate();
    this.serviceYearAndMonth = getPreviousMonth();
    loadFonts();
  },
  methods: {
    getExcelextractedExcelData(event) {
      let { excelHeaders } = this;
      let xlsxfile = event.target.files ? event.target.files[0] : null;

      if (xlsxfile) {
        readXlsxFile(xlsxfile)
          .then((extractedExcelData) => {
            excelHeaders = extractedExcelData[0];
            let body = extractedExcelData.slice(1);
            this.excelBody = createObjectsFromTwoArrays(excelHeaders, body);
          })
          .catch((error) => {
            alert("Netinkamas pdf formatas:", error);
          });
      }
    },
    generateTable(head, body) {
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
          font: "Book Antique",
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 12,
          font: "Book Antique",
        },
      };
    },
    generateInvText(doc, person) {
      const { parent, no, email } = person;
      const {
        invDate = "",
        fullName = "",
        accountNumber = "",
        serviceYearAndMonth = "",
      } = this.$data || {};

      const rightAligment = 120;
      const leftAlignment = 14;
      const baseFont = "Book Antique";

      doc.setFont(baseFont, "bold");
      doc.setFontSize(12);
      doc.text("SĄSKAITA FAKTŪRA", 105, 20, null, null, "center");
      doc.setFont(baseFont, "normal");
      doc.text(
        `Serija MED Nr. ${serviceYearAndMonth.slice(-5)}-${no}`,
        105,
        26,
        null,
        null,
        "center"
      );
      doc.setFont(baseFont, "normal");
      doc.text(invDate, 105, 32, null, null, "center");

      doc.setFont(baseFont, "bold");
      doc.text("Pirkėja(-jas)", rightAligment, 60, null, null, "left");
      doc.setFont(baseFont, "normal");
      doc.text(`${parent}`, rightAligment, 66, null, null, "left");
      doc.text(`El. p. ${email}`, rightAligment, 72, null, null, "left");

      doc.setFont(baseFont, "bold");
      doc.text("Pardavėja", leftAlignment, 60);
      doc.setFont(baseFont, "normal");
      doc.text(fullName, leftAlignment, 66);
      doc.text("Sąskaita AB „Swedbank“", leftAlignment, 72);
      doc.text(accountNumber, leftAlignment, 78);
    },
    // converts 36 to 36,00
    formatIntegerToPrice(int) {
      return int.toFixed(2).replace(".", ",");
    },
    async generatePDF() {
      let { excelBody, price, serviceYearAndMonth } = this;

      for (const person of excelBody) {
        let doc = new jsPDF();

        let { amount, child, no } = person;
        let childName = child.trim().split(" ")[0];
        let invTitle = `MED_${serviceYearAndMonth
          .slice(-5)
          .replace("-", "_")}_${no}_${childName}`;

        this.generateInvText(doc, person);
        const tableBody = this.generateTableBody(Number(amount), price);
        await doc.autoTable(this.generateTable(tableHeaders, tableBody));

        // await doc.save(`${invTitle}.pdf`, { returnPromise: true });
        await new Promise((resolve) => {
          doc.save(`${invTitle}.pdf`);
          setTimeout(resolve, 100);
        });
        this.$refs.fileInput.value = null;
      }
    },
    generateTableBody(amount, price) {
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
            content: `${this.formatIntegerToPrice(price)}`,
            halign: "left",
          },
          // suma
          {
            content: `${this.formatIntegerToPrice(amount * price)}`,
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
            content: `${this.formatIntegerToPrice(amount * price)}`,
            colSpan: 1,
            halign: "left",
          },
        ],
      ];
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
