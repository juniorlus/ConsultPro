import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Save, Loader2, User, Activity, Plus, 
  Calendar, FileText, ChevronRight, TrendingUp, Info, FileDown,
  X, Coffee, Sun, Utensils, Moon, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { generateDietPlanPDF } from '../lib/pdfGenerator';

interface Consultation {
  id: string;
  data_consulta: string;
  peso: number;
  cintura: number | null;
  quadril: number | null;
  percentual_gordura: number | null;
  observacoes: string | null;
  proximo_retorno: string | null;
}

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

const PatientProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  const [patient, setPatient] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dietPlans, setDietPlans] = useState<any[]>([]);

  const [newConsultation, setNewConsultation] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientRes, consultRes, plansRes] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', id).single(),
        supabase.from('consultas').select('*').eq('paciente_id', id).order('data_consulta', { ascending: true }),
        supabase.from('planos_alimentares').select('*').eq('paciente_id', id).order('created_at', { ascending: false })
      ]);

      if (patientRes.error) throw patientRes.error;
      
      setPatient(patientRes.data);
      setFormData(patientRes.data);
      setConsultations(consultRes.data || []);
      setDietPlans(plansRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!patient || !formData) return false;
    return JSON.stringify(patient) !== JSON.stringify(formData);
  }, [patient, formData]);

  const age = useMemo(() => {
    if (!formData?.data_nascimento) return null;
    const birthDate = new Date(formData.data_nascimento + 'T12:00:00');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [formData?.data_nascimento]);

  const chartData = useMemo(() => {
    return consultations.map(c => ({
      data: new Date(c.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      peso: c.peso
    }));
  }, [consultations]);

  const getRadarData = () => {
    const isHypertrophy = patient.objetivos?.includes('Ganhar massa');
    
    return [
      { subject: 'Proteínas', A: isHypertrophy ? 95 : 80, B: 70, fullMark: 100 },
      { subject: 'Carbos', A: isHypertrophy ? 90 : 60, B: 75, fullMark: 100 },
      { subject: 'Gorduras', A: 70, B: 65, fullMark: 100 },
      { subject: 'Fibras', A: 85, B: 50, fullMark: 100 },
      { subject: 'Hidratação', A: 100, B: 60, fullMark: 100 },
    ];
  };

  const radarData = patient ? getRadarData() : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: val
    }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    const currentArray = (formData as any)[field] as string[] || [];
    let newArray;
    
    if (value === 'Nenhum') {
      newArray = currentArray.includes('Nenhum') ? [] : ['Nenhum'];
    } else {
      newArray = currentArray.filter(item => item !== 'Nenhum');
      newArray = newArray.includes(value)
        ? newArray.filter(item => item !== value)
        : [...newArray, value];
    }
    
    setFormData((prev: any) => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleSavePatient = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('pacientes').update(formData).eq('id', id);
      if (error) throw error;
      setPatient(formData);
      alert('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        paciente_id: id,
        data_consulta: newConsultation.data_consulta,
        peso: parseFloat(newConsultation.peso),
        cintura: newConsultation.cintura ? parseFloat(newConsultation.cintura) : null,
        quadril: newConsultation.quadril ? parseFloat(newConsultation.quadril) : null,
        percentual_gordura: newConsultation.percentual_gordura ? parseFloat(newConsultation.percentual_gordura) : null,
        observacoes: newConsultation.observacoes,
        proximo_retorno: newConsultation.proximo_retorno || null,
      };

      const { error } = await supabase.from('consultas').insert([payload]);
      if (error) throw error;

      setShowConsultationModal(false);
      setNewConsultation({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: '',
      });
      fetchData();
      alert('Consulta registrada com sucesso!');
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert('Erro ao registrar consulta. Verifique o peso.');
    }
  };

  if (loading) return <div className="loading-container"><Loader2 className="animate-spin" size={48} /> Carregando perfil...</div>;

  return (
    <div className="patient-profile-page">
      <div className="page-header-actions" style={{ justifyContent: 'flex-start', gap: '16px', marginBottom: '40px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/pacientes')}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', fontWeight: 800 }}>{patient.nome}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {age ? `${age} anos` : 'Idade não informada'} • {patient.sexo || 'Sexo não informado'}
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section className="section-card">
            <div className="section-title">
              <User size={24} color="var(--accent-color)" />
              Dados do Paciente
            </div>

            <div className="tabs-container">
              <button className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`} onClick={() => setActiveTab('pessoal')}>Pessoal</button>
              <button className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`} onClick={() => setActiveTab('clinico')}>Clínico</button>
              <button className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`} onClick={() => setActiveTab('habitos')}>Hábitos</button>
            </div>

            <div className="tab-content" style={{ marginTop: '24px' }}>
              {activeTab === 'pessoal' && (
                <div className="form-grid">
                  <div className="form-row">
                    <label>Nome Completo</label>
                    <input name="nome" value={formData.nome} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>E-mail</label>
                    <input name="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>Telefone</label>
                    <input name="telefone" value={formData.telefone} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>WhatsApp</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>Data de Nascimento</label>
                    <input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>Sexo</label>
                    <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                      <option value="">Selecione</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'clinico' && (
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="form-row">
                      <label>Peso Inicial (kg)</label>
                      <input type="number" step="0.1" name="peso_inicial" value={formData.peso_inicial || ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-row">
                      <label>Altura (m)</label>
                      <input type="number" step="0.01" name="altura" value={formData.altura || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <label>Objetivos</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['Emagrecer', 'Ganhar massa', 'Saúde geral', 'Performance'].map(obj => (
                        <label key={obj} className="history-item" style={{ margin: 0, padding: '8px 16px', border: formData.objetivos?.includes(obj) ? '1px solid var(--accent-color)' : '1px solid #e2e8f0', backgroundColor: formData.objetivos?.includes(obj) ? 'var(--accent-light)' : 'white' }}>
                          <input type="checkbox" checked={formData.objetivos?.includes(obj)} onChange={() => handleArrayToggle('objetivos', obj)} style={{ display: 'none' }} />
                          {obj}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>Patologias / Condições</label>
                    <textarea name="medicamentos" value={formData.medicamentos || ''} onChange={handleInputChange} placeholder="Medicamentos, suplementos, patologias..." style={{ minHeight: '120px' }} />
                  </div>
                </div>
              )}

              {activeTab === 'habitos' && (
                <div className="form-grid">
                  <div className="form-row">
                    <label>Refeições/dia</label>
                    <input type="number" name="refeicoes_por_dia" value={formData.refeicoes_por_dia || ''} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>Água (L/dia)</label>
                    <input type="number" step="0.1" name="litros_agua" value={formData.litros_agua || ''} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>Horário Acorda</label>
                    <input name="horario_acorda" value={formData.horario_acorda || ''} onChange={handleInputChange} />
                  </div>
                  <div className="form-row">
                    <label>Horário Dorme</label>
                    <input name="horario_dorme" value={formData.horario_dorme || ''} onChange={handleInputChange} />
                  </div>
                  <div className="form-row" style={{ gridColumn: 'span 2' }}>
                    <label>Observações de Hábitos</label>
                    <textarea name="observacoes" value={formData.observacoes || ''} onChange={handleInputChange} />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="section-card">
            <div className="section-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity size={24} color="var(--accent-color)" />
                Consultas e Evolução
              </div>
              <button className="btn btn-primary" onClick={() => setShowConsultationModal(true)}>
                <Plus size={18} /> Nova Consulta
              </button>
            </div>

            <div className="chart-container">
              {consultations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--accent-color)', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="peso" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <TrendingUp size={48} />
                  <p>Nenhuma consulta registrada ainda</p>
                </div>
              )}
            </div>

            <div className="consultation-list">
              <div className="consultation-item consultation-header">
                <div>Data</div>
                <div>Peso (kg)</div>
                <div>Cintura</div>
                <div>Quadril</div>
                <div>% Gordura</div>
                <div>Ações</div>
              </div>
              {[...consultations].reverse().map(c => (
                <div key={c.id} className="consultation-item">
                  <div style={{ fontWeight: 600 }}>{new Date(c.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{c.peso} kg</div>
                  <div>{c.cintura ? `${c.cintura} cm` : '--'}</div>
                  <div>{c.quadril ? `${c.quadril} cm` : '--'}</div>
                  <div>{c.percentual_gordura ? `${c.percentual_gordura}%` : '--'}</div>
                  <div title={c.observacoes || 'Sem observações'}>
                    <Info size={18} color="#94a3b8" cursor="help" />
                  </div>
                </div>
              ))}
              {consultations.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Nenhum histórico encontrado.</div>
              )}
            </div>
          </section>
        </div>

        <div className="side-column">
          <section className="section-card">
            <div className="section-title">
              <FileText size={24} color="var(--accent-color)" />
              Planos Alimentares
            </div>

            <button 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                marginBottom: '24px', 
                justifyContent: 'center', 
                height: '56px', 
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
              }}
              onClick={() => navigate(`/pacientes/${id}/plano/novo`)}
            >
              <Sparkles size={20} />
              Gerar Plano com IA
            </button>

            <div className="history-list">
              {dietPlans.length > 0 ? dietPlans.map(plan => (
                <div key={plan.id} className="history-item" onClick={() => setSelectedPlan(plan)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--accent-color)' }}><Calendar size={20} /></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{plan.nome_plano || 'Plano Alimentar'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(plan.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="action-icon" 
                      title="Baixar PDF"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateDietPlanPDF({
                          patientName: patient.nome,
                          planName: plan.nome_plano,
                          meals: plan.refeicoes
                        });
                      }}
                    >
                      <FileDown size={18} />
                    </button>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Nenhum plano alimentar gerado ainda
                </div>
              )}
            </div>
          </section>

          <section className="section-card" style={{ marginTop: '24px' }}>
            <div className="section-title">
              <TrendingUp size={24} color="var(--accent-color)" />
              Equilíbrio Nutricional
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--border-color)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Ideal" dataKey="A" stroke="var(--accent-color)" fill="var(--accent-color)" fillOpacity={0.6} />
                  <Radar name="Atual" dataKey="B" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }} itemStyle={{ fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      {selectedPlan && (
        <div className="modal-overlay" onClick={() => setSelectedPlan(null)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedPlan.nome_plano}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Gerado em {new Date(selectedPlan.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <button className="action-icon" onClick={() => setSelectedPlan(null)}><X size={24} /></button>
            </div>

            <div className="plan-viewer-content" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
              {Array.isArray(selectedPlan.refeicoes) && selectedPlan.refeicoes[0]?.dia ? (
                // Novo formato (Plano Semanal)
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {selectedPlan.refeicoes.map((day: DietPlanDay) => (
                    <div key={day.dia}>
                      <h3 style={{ borderBottom: '2px solid var(--accent-light)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--primary-color)' }}>{day.dia}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {Object.entries(day.refeicoes).map(([key, options]) => (
                          <div key={key} style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem', color: 'var(--accent-color)', textTransform: 'capitalize' }}>
                              {key.replace(/_/g, ' ')}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {options.filter(o => o).map((opt, i) => (
                                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--accent-light)', paddingLeft: '8px' }}>{opt}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Formato antigo (Legado)
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {Array.isArray(selectedPlan.refeicoes) && selectedPlan.refeicoes.map((meal: any, idx: number) => (
                    <div key={idx} style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>{meal.nome}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{meal.horario}</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {meal.itens.map((item: any, i: number) => (
                          <li key={i} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>• {item.alimento} ({item.quantidade})</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => generateDietPlanPDF({ patientName: patient.nome, planName: selectedPlan.nome_plano, meals: selectedPlan.refeicoes })}>
                <FileDown size={18} /> Baixar PDF
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedPlan(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {showConsultationModal && (
        <div className="modal-overlay" onClick={() => setShowConsultationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="section-title">Registrar Nova Consulta</h2>
            <form onSubmit={handleSaveConsultation}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-row">
                  <label>Data da Consulta</label>
                  <input type="date" value={newConsultation.data_consulta} onChange={e => setNewConsultation({...newConsultation, data_consulta: e.target.value})} required />
                </div>
                <div className="form-row">
                  <label>Peso (kg)</label>
                  <input type="number" step="0.1" value={newConsultation.peso} onChange={e => setNewConsultation({...newConsultation, peso: e.target.value})} required placeholder="0.0" />
                </div>
                <div className="form-row">
                  <label>Cintura (cm)</label>
                  <input type="number" step="0.1" value={newConsultation.cintura} onChange={e => setNewConsultation({...newConsultation, cintura: e.target.value})} placeholder="Opcional" />
                </div>
                <div className="form-row">
                  <label>Quadril (cm)</label>
                  <input type="number" step="0.1" value={newConsultation.quadril} onChange={e => setNewConsultation({...newConsultation, quadril: e.target.value})} placeholder="Opcional" />
                </div>
                <div className="form-row">
                  <label>% Gordura</label>
                  <input type="number" step="0.1" value={newConsultation.percentual_gordura} onChange={e => setNewConsultation({...newConsultation, percentual_gordura: e.target.value})} placeholder="Opcional" />
                </div>
                <div className="form-row">
                  <label>Próximo Retorno</label>
                  <input type="date" value={newConsultation.proximo_retorno} onChange={e => setNewConsultation({...newConsultation, proximo_retorno: e.target.value})} />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: '20px' }}>
                <label>Observações</label>
                <textarea value={newConsultation.observacoes} onChange={e => setNewConsultation({...newConsultation, observacoes: e.target.value})} placeholder="Evolução, dificuldades, novas metas..." style={{ minHeight: '80px' }} />
              </div>
              <div className="form-actions" style={{ marginTop: '32px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowConsultationModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>Salvar consulta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
