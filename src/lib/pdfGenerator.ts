import { jsPDF } from 'jspdf';

interface MealItem {
  alimento: string;
  quantidade: string;
}

interface Meal {
  nome: string;
  horario: string;
  itens: MealItem[];
}

interface PDFData {
  patientName: string;
  planName: string;
  meals: Meal[];
}

export const generateDietPlanPDF = (data: PDFData) => {
  const { patientName, planName, meals } = data;
  const doc = new jsPDF();
  
  // Colors and Styles
  const primaryColor = [0, 31, 63]; // Navy Blue
  const accentColor = [16, 185, 129]; // Emerald Green
  
  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PLANO ALIMENTAR', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Nutrição Personalizada', 105, 30, { align: 'center' });
  
  // Patient Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', 20, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(patientName, 42, 55);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Plano:', 20, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(planName, 35, 62);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 150, 55);
  
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 70, 190, 70);
  
  // Meals
  let yPos = 80;
  
  meals.forEach((meal, index) => {
    // Check page break
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Meal Header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPos, 170, 10, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${meal.nome} - ${meal.horario}`, 25, yPos + 7);
    
    yPos += 15;
    
    // Items
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    meal.itens.forEach(item => {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.circle(25, yPos - 1, 1, 'F');
      
      doc.text(`${item.alimento}`, 30, yPos);
      doc.text(`${item.quantidade}`, 150, yPos, { align: 'right' });
      
      doc.setDrawColor(241, 245, 249);
      doc.line(30, yPos + 2, 180, yPos + 2);
      
      yPos += 8;
    });
    
    yPos += 10;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
  }
  
  // Save
  doc.save(`Plano_Alimentar_${patientName.replace(/\s+/g, '_')}.pdf`);
};
