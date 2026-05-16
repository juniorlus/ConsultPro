import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { generateContent } from '../lib/gemini';
import { 
  ArrowLeft, Save, Loader2, Sparkles, 
  Calendar, Coffee, Sun, Utensils, Moon, CheckCircle2, AlertCircle
} from 'lucide-react';

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

const DietPlanCreator: React.FC = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [planName, setPlanName] = useState('Novo Plano Alimentar');
  const [weeklyPlan, setWeeklyPlan] = useState<DietPlanDay[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [generatingIA, setGeneratingIA] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase.from('pacientes').select('*').eq('id', patientId).single();
      if (error) throw error;
      if (data) setPatient(data);
    } catch (err) {
      console.error('Error fetching patient:', err);
      setError('Erro ao carregar dados do paciente.');
    }
  };

  const generateWithIA = async () => {
    if (!patient) return;
    setGeneratingIA(true);
    setError(null);
    
    try {
      const prompt = `
Você é um nutricionista profissional.

Gere um plano alimentar semanal com base nos dados abaixo.

⚠️ Regras:
- Responda APENAS em JSON válido
- Não use markdown ou explicações fora do JSON
- Respeite restrições e alergias
- Para CADA refeição, você DEVE fornecer EXATAMENTE 5 opções de alimentos/combinações variadas

Dados do paciente:
${JSON.stringify(patient, null, 2)}

Formato obrigatório:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "lanche_manha": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "almoco": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "lanche_tarde": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "jantar": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"]
      }
    }
  ]
}
`;

      const responseText = await generateContent(prompt);
      const data = JSON.parse(responseText);

      if (data.plano_semanal) {
        setWeeklyPlan(data.plano_semanal);
        setPlanName(`Plano Alimentar - ${patient.nome} - IA`);
      } else {
        throw new Error('Formato de resposta inválido da IA');
      }
    } catch (err: any) {
      console.error('Error generating with IA:', err);
      setError(err.message || 'Erro ao conectar com a IA. Tente novamente.');
    } finally {
      setGeneratingIA(false);
    }
  };

  const handleOptionChange = (dayIndex: number, mealKey: keyof DietPlanDay['refeicoes'], optionIndex: number, newValue: string) => {
    const updatedPlan = [...weeklyPlan];
    updatedPlan[dayIndex].refeicoes[mealKey][optionIndex] = newValue;
    setWeeklyPlan(updatedPlan);
  };

  const handleSave = async () => {
    if (!user || weeklyPlan.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from('planos_alimentares').insert([{
        paciente_id: patientId,
        nome_plano: planName,
        refeicoes: weeklyPlan, // Salvando o JSON completo
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      alert('Plano alimentar salvo com sucesso!');
      navigate(`/pacientes/${patientId}`);
    } catch (err: any) {
      console.error('Error saving diet plan:', err);
      setError('Erro ao salvar plano alimentar no banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const activeDay = weeklyPlan[activeDayIndex];

  return (
    <div className="diet-creator-page">
      <div className="page-header-actions" style={{ justifyContent: 'flex-start', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(`/pacientes/${patientId}`)}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', fontWeight: 800 }}>Plano Alimentar Inteligente</h1>
          <p style={{ color: 'var(--text-muted)' }}>Paciente: <strong style={{ color: 'var(--primary-color)' }}>{patient?.nome}</strong></p>
        </div>
        
        {!weeklyPlan.length && (
          <button 
            className="btn btn-primary" 
            style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '12px 24px', fontSize: '1.1rem' }}
            onClick={generateWithIA}
            disabled={generatingIA}
          >
            {generatingIA ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            {generatingIA ? 'IA Gerando Plano...' : 'Gerar com IA'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {!weeklyPlan.length && !generatingIA && (
        <div className="empty-state-card" style={{ textAlign: 'center', padding: '60px', background: 'var(--card-bg)', borderRadius: '24px', border: '2px dashed var(--border-color)' }}>
          <Sparkles size={48} color="var(--accent-color)" style={{ marginBottom: '20px', opacity: 0.5 }} />
          <h3>Nenhum plano gerado</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px' }}>
            Clique no botão acima para que a nossa inteligência artificial crie um plano personalizado baseado no perfil deste paciente.
          </p>
        </div>
      )}

      {generatingIA && (
        <div className="loading-ia-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ia-loader">
            <div className="ia-dot"></div>
            <div className="ia-dot"></div>
            <div className="ia-dot"></div>
          </div>
          <h3 style={{ marginTop: '24px' }}>Criando Plano Personalizado...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Analisando objetivos, restrições e preferências do paciente.</p>
        </div>
      )}

      {weeklyPlan.length > 0 && (
        <div className="plan-editor-container">
          <div className="form-card" style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Nome do Plano</label>
            <input 
              value={planName} 
              onChange={(e) => setPlanName(e.target.value)} 
              className="plan-name-input"
              style={{ fontSize: '1.2rem', fontWeight: 700, width: '100%', border: 'none', background: 'var(--input-bg)', padding: '12px', borderRadius: '8px' }}
            />
          </div>

          <div className="days-nav" style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
            {weeklyPlan.map((day, idx) => (
              <button 
                key={day.dia} 
                className={`day-nav-btn ${activeDayIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveDayIndex(idx)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeDayIndex === idx ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: activeDayIndex === idx ? 'white' : 'var(--text-muted)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: activeDayIndex === idx ? '0 4px 12px rgba(0, 31, 63, 0.2)' : 'none'
                }}
              >
                {day.dia}
              </button>
            ))}
          </div>

          <div className="meals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {/* Café da Manhã */}
            <MealCard 
              title="Café da Manhã" 
              icon={<Coffee size={20} />} 
              options={activeDay.refeicoes.cafe_da_manha} 
              onOptionChange={(idx, val) => handleOptionChange(activeDayIndex, 'cafe_da_manha', idx, val)}
            />

            {/* Lanche da Manhã */}
            <MealCard 
              title="Lanche da Manhã" 
              icon={<Sun size={20} />} 
              options={activeDay.refeicoes.lanche_manha} 
              onOptionChange={(idx, val) => handleOptionChange(activeDayIndex, 'lanche_manha', idx, val)}
            />

            {/* Almoço */}
            <MealCard 
              title="Almoço" 
              icon={<Utensils size={20} />} 
              options={activeDay.refeicoes.almoco} 
              onOptionChange={(idx, val) => handleOptionChange(activeDayIndex, 'almoco', idx, val)}
            />

            {/* Lanche da Tarde */}
            <MealCard 
              title="Lanche da Tarde" 
              icon={<Sun size={20} />} 
              options={activeDay.refeicoes.lanche_tarde} 
              onOptionChange={(idx, val) => handleOptionChange(activeDayIndex, 'lanche_tarde', idx, val)}
            />

            {/* Jantar */}
            <MealCard 
              title="Jantar" 
              icon={<Moon size={20} />} 
              options={activeDay.refeicoes.jantar} 
              onOptionChange={(idx, val) => handleOptionChange(activeDayIndex, 'jantar', idx, val)}
            />
          </div>

          <div className="sticky-actions-bar" style={{ position: 'sticky', bottom: '24px', marginTop: '40px', padding: '20px', background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 -10px 25px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>
              <CheckCircle2 size={24} />
              Plano Gerado e Editável
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setWeeklyPlan([])}>Descartar e Recomeçar</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={loading} 
                style={{ backgroundColor: 'var(--accent-color)', padding: '12px 32px' }}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Salvar Plano Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MealCardProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  onOptionChange: (index: number, value: string) => void;
}

const MealCard: React.FC<MealCardProps> = ({ title, icon, options, onOptionChange }) => {
  return (
    <div className="meal-edit-card" style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{title}</h3>
      </div>
      
      <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>{i + 1}</span>
            <input 
              value={opt} 
              onChange={(e) => onOptionChange(i, e.target.value)}
              placeholder={`Opção ${i + 1}...`}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DietPlanCreator;
