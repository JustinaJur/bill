import { jsPDF } from "jspdf";
import { callAddFont } from "@/assets/fonts/ARIALUNI-normal.js";
import { callAddFontBold } from "@/assets/fonts/Arial Unicode MS Bold-bold.js";

export const loadFonts = async () => {
    await Promise.all([
      jsPDF.API.events.push(["addFonts", callAddFont]),
      jsPDF.API.events.push(["addFonts", callAddFontBold]),
    ]);
  };