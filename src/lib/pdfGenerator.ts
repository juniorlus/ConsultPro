import { jsPDF } from 'jspdf';

interface DietPlanDay {
  dia: string;
  refeicoes: {
    cafe_da_manha: string[];
    lanche_manha: string[];
    almoco: string[];
    lanche_tarde: string[];
    jantar: string[];
  };
}

interface PDFData {
  patientName: string;
  planName: string;
  meals: any; // Pode ser o formato antigo ou o novo
}

export const generateDietPlanPDF = (data: PDFData) => {
  const { patientName, planName, meals } = data;
  const doc = new jsPDF();
  
  const primaryColor = [0, 31, 63];
  
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
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 55);
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 70, 190, 70);

  let yPos = 80;

  // Verificar se é o novo formato (Plano Semanal)
  if (Array.isArray(meals) && meals.length > 0 && meals[0].dia) {
    const weeklyPlan = meals as DietPlanDay[];
    
    weeklyPlan.forEach((day) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setTextColor(255, 255, 255);
      doc.rect(20, yPos, 170, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(day.dia, 105, yPos + 7, { align: 'center' });
      yPos += 15;

      const mealTitles: { [key: string]: string } = {
        cafe_da_manha: '☀️ Café da Manhã',
        lanche_manha: '🍎 Lanche da Manhã',
        almoco: '🥗 Almoço',
        lanche_tarde: '☕ Lanche da Tarde',
        jantar: '🌙 Jantar'
      };

      Object.entries(day.refeicoes).forEach(([key, options]) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(mealTitles[key] || key, 25, yPos);
        yPos += 7;

        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        options.forEach((opt, idx) => {
          if (opt) {
            doc.text(`${idx + 1}. ${opt}`, 30, yPos);
            yPos += 6;
          }
        });
        yPos += 4;
      });
      yPos += 10;
    });
  } else {
    // Formato antigo (legado)
    const legacyMeals = meals as any[];
    legacyMeals.forEach((meal) => {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos, 170, 10, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${meal.nome} - ${meal.horario}`, 25, yPos + 7);
      yPos += 15;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      meal.itens.forEach((item: any) => {
        doc.text(`• ${item.alimento} - ${item.quantidade}`, 30, yPos);
        yPos += 8;
      });
      yPos += 10;
    });
  }
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
  }
  
  doc.save(`Plano_Alimentar_${patientName.replace(/\s+/g, '_')}.pdf`);
};
