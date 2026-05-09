import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Trash2, Save, Loader2, Clock, Sparkles, FileText } from 'lucide-react';
import { generateDietPlanPDF } from '../lib/pdfGenerator';

interface MealItem {
  id: string;
  alimento: string;
  quantidade: string;
}

interface Meal {
  id: string;
  nome: string;
  horario: string;
  itens: MealItem[];
}

const DietPlanCreator: React.FC = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [planName, setPlanName] = useState('Novo Plano Alimentar');
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: crypto.randomUUID(),
      nome: 'Café da Manhã',
      horario: '08:00',
      itens: [{ id: crypto.randomUUID(), alimento: '', quantidade: '' }]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [generatingIA, setGeneratingIA] = useState(false);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    const { data } = await supabase.from('pacientes').select('*').eq('id', patientId).single();
    if (data) setPatient(data);
  };

  const addMeal = () => {
    setMeals([...meals, {
      id: crypto.randomUUID(),
      nome: 'Nova Refeição',
      horario: '12:00',
      itens: [{ id: crypto.randomUUID(), alimento: '', quantidade: '' }]
    }]);
  };

  const removeMeal = (mealId: string) => {
    setMeals(meals.filter(m => m.id !== mealId));
  };

  const updateMeal = (mealId: string, field: keyof Meal, value: string) => {
    setMeals(meals.map(m => m.id === mealId ? { ...m, [field]: value } : m));
  };

  const addMealItem = (mealId: string) => {
    setMeals(meals.map(m => m.id === mealId ? {
      ...m,
      itens: [...m.itens, { id: crypto.randomUUID(), alimento: '', quantidade: '' }]
    } : m));
  };

  const updateMealItem = (mealId: string, itemId: string, field: keyof MealItem, value: string) => {
    setMeals(meals.map(m => m.id === mealId ? {
      ...m,
      itens: m.itens.map(i => i.id === itemId ? { ...i, [field]: value } : i)
    } : m));
  };

  const removeMealItem = (mealId: string, itemId: string) => {
    setMeals(meals.map(m => m.id === mealId ? {
      ...m,
      itens: m.itens.filter(i => i.id !== itemId)
    } : m));
  };

  const generateWithIA = async () => {
    if (!patient) return;
    setGeneratingIA(true);
    
    // Simulação de chamada para IA (pode ser substituída por OpenAI/Gemini API)
    setTimeout(() => {
      const isHypertrophy = patient.objetivos?.includes('Ganhar massa');
      
      const hasGlutenRestriction = patient.restricoes_alimentares?.includes('Glúten');
      
      const suggestedMeals: Meal[] = [
        {
          id: crypto.randomUUID(),
          nome: 'Café da Manhã',
          horario: '07:30',
          itens: [
            { id: crypto.randomUUID(), alimento: hasGlutenRestriction ? 'Pão de forma sem glúten' : 'Pão integral', quantidade: '2 fatias' },
            { id: crypto.randomUUID(), alimento: 'Ovos mexidos', quantidade: '2 unidades' },
            { id: crypto.randomUUID(), alimento: 'Fruta (Mamão ou Banana)', quantidade: '1 porção' }
          ]
        },
        {
          id: crypto.randomUUID(),
          nome: 'Lanche da Manhã',
          horario: '10:30',
          itens: [
            { id: crypto.randomUUID(), alimento: 'Iogurte natural', quantidade: '1 pote' },
            { id: crypto.randomUUID(), alimento: 'Mix de castanhas', quantidade: '20g' }
          ]
        },
        {
          id: crypto.randomUUID(),
          nome: 'Almoço',
          horario: '12:30',
          itens: [
            { id: crypto.randomUUID(), alimento: 'Arroz integral ou Batata doce', quantidade: isHypertrophy ? '150g' : '100g' },
            { id: crypto.randomUUID(), alimento: 'Peito de frango grelhado', quantidade: '120g' },
            { id: crypto.randomUUID(), alimento: 'Feijão preto/carioca', quantidade: '1 concha média' },
            { id: crypto.randomUUID(), alimento: 'Salada de folhas verdes à vontade', quantidade: 'Livre' }
          ]
        },
        {
          id: crypto.randomUUID(),
          nome: 'Lanche da Tarde',
          horario: '16:00',
          itens: [
            { id: crypto.randomUUID(), alimento: 'Fruta com aveia', quantidade: '1 unidade' },
            { id: crypto.randomUUID(), alimento: 'Whey Protein (opcional)', quantidade: '1 scoop' }
          ]
        },
        {
          id: crypto.randomUUID(),
          nome: 'Jantar',
          horario: '19:30',
          itens: [
            { id: crypto.randomUUID(), alimento: 'Proteína (Peixe ou Frango)', quantidade: '100g' },
            { id: crypto.randomUUID(), alimento: 'Legumes cozidos (Brócolis, Cenoura)', quantidade: '150g' }
          ]
        }
      ];

      setMeals(suggestedMeals);
      setPlanName(`Plano Alimentar - ${patient.objetivos?.[0] || 'Personalizado'}`);
      setGeneratingIA(false);
      alert('Plano gerado com sucesso pela IA! Você pode fazer ajustes agora.');
    }, 2000);
  };

  const handleExportPDF = () => {
    if (!patient) return;
    generateDietPlanPDF({
      patientName: patient.nome,
      planName: planName,
      meals: meals
    });
  };

  const handleSave = async (exportPdf = false) => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('planos_alimentares').insert([{
        paciente_id: patientId,
        nome_plano: planName,
        refeicoes: meals,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      if (exportPdf) {
        handleExportPDF();
      }
      
      alert('Plano alimentar salvo com sucesso!');
      navigate(`/pacientes/${patientId}`);
    } catch (error) {
      console.error('Error saving diet plan:', error);
      alert('Erro ao salvar plano alimentar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diet-creator-page">
      <div className="page-header-actions" style={{ justifyContent: 'flex-start', gap: '16px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(`/pacientes/${patientId}`)}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}>Criar Plano Alimentar</h1>
          <p style={{ color: '#64748b' }}>Paciente: <strong>{patient?.nome}</strong></p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
          onClick={generateWithIA}
          disabled={generatingIA}
        >
          {generatingIA ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
          {generatingIA ? 'A IA está pensando...' : 'Gerar com IA'}
        </button>
      </div>

      <div className="form-card" style={{ marginBottom: '32px' }}>
        <div className="form-row">
          <label>Nome do Plano</label>
          <input 
            value={planName} 
            onChange={(e) => setPlanName(e.target.value)} 
            style={{ fontSize: '1.2rem', fontWeight: 700 }}
          />
        </div>
      </div>

      <div className="meals-container">
        {meals.map((meal) => (
          <div key={meal.id} className="meal-card">
            <div className="meal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input 
                  className="meal-title-input"
                  value={meal.nome}
                  onChange={(e) => updateMeal(meal.id, 'nome', e.target.value)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                  <Clock size={16} />
                  <input 
                    type="time" 
                    value={meal.horario}
                    onChange={(e) => updateMeal(meal.id, 'horario', e.target.value)}
                    style={{ border: 'none', background: 'none', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}
                  />
                </div>
              </div>
              <button className="action-icon" onClick={() => removeMeal(meal.id)} title="Remover Refeição">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="meal-items">
              {meal.itens.map((item) => (
                <div key={item.id} className="item-row">
                  <input 
                    placeholder="Alimento" 
                    value={item.alimento}
                    onChange={(e) => updateMealItem(meal.id, item.id, 'alimento', e.target.value)}
                  />
                  <input 
                    placeholder="Quantidade" 
                    value={item.quantidade}
                    onChange={(e) => updateMealItem(meal.id, item.id, 'quantidade', e.target.value)}
                  />
                  <button className="action-icon" onClick={() => removeMealItem(meal.id, item.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button className="btn btn-secondary" style={{ width: 'fit-content', marginTop: '8px' }} onClick={() => addMealItem(meal.id)}>
                <Plus size={16} /> Item
              </button>
            </div>
          </div>
        ))}

        <button className="add-meal-btn" onClick={addMeal}>
          <Plus size={24} /> Adicionar Nova Refeição
        </button>
      </div>

      <div className="diet-summary-bar">
        <div style={{ color: '#64748b' }}>
          <strong>{meals.length}</strong> refeições configuradas
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => handleSave(true)} disabled={loading}>
            <FileText size={20} />
            Salvar e PDF
          </button>
          <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={loading} style={{ backgroundColor: 'var(--accent-color)' }}>
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Salvar Plano Alimentar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DietPlanCreator;
