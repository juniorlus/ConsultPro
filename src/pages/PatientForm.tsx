import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Loader2, User, Activity, Coffee } from 'lucide-react';

const PatientForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivo_texto: '',
    nivel_atividade: 'Sedentário',
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: 3,
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
    objetivos: [] as string[],
    patologias: [] as string[],
    restricoes_alimentares: [] as string[],
    alergias: [] as string[],
  });

  useEffect(() => {
    if (isEditing && user) {
      fetchPatient();
    }
  }, [id, user]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          ...data,
          peso_inicial: data.peso_inicial?.toString() || '',
          altura: data.altura?.toString() || '',
          litros_agua: data.litros_agua?.toString() || '',
          objetivos: data.objetivos || [],
          patologias: data.patologias || [],
          restricoes_alimentares: data.restricoes_alimentares || [],
          alergias: data.alergias || [],
        });
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const age = useMemo(() => {
    if (!formData.data_nascimento) return null;
    const birthDate = new Date(formData.data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [formData.data_nascimento]);

  const imc = useMemo(() => {
    const weight = parseFloat(formData.peso_inicial);
    const height = parseFloat(formData.altura);
    if (weight && height) {
      const h = height > 3 ? height / 100 : height; // assume cm if > 3
      return (weight / (h * h)).toFixed(1);
    }
    return null;
  }, [formData.peso_inicial, formData.altura]);

  const formatTime = (val: string) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '');
    if (num.length <= 2) return num.padStart(2, '0') + ':00';
    if (num.length <= 4) {
      const h = num.slice(0, num.length - 2).padStart(2, '0');
      const m = num.slice(-2).padStart(2, '0');
      return `${h}:${m}`;
    }
    return val;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    const currentArray = (formData as any)[field] as string[];
    let newArray;
    
    if (value === 'Nenhum') {
      newArray = currentArray.includes('Nenhum') ? [] : ['Nenhum'];
    } else {
      newArray = currentArray.filter(item => item !== 'Nenhum');
      newArray = newArray.includes(value)
        ? newArray.filter(item => item !== value)
        : [...newArray, value];
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const h = parseFloat(formData.altura);
      const heightInMeters = h > 3 ? h / 100 : h;

      const payload = {
        ...formData,
        nutricionista_id: user?.id,
        peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
        altura: heightInMeters,
        litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        refeicoes_por_dia: parseInt(formData.refeicoes_por_dia.toString()),
      };

      let result;
      if (isEditing) {
        result = await supabase.from('pacientes').update(payload).eq('id', id).select();
      } else {
        result = await supabase.from('pacientes').insert([payload]).select();
      }

      if (result.error) throw result.error;

      const savedId = result.data?.[0]?.id;
      alert(isEditing ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!');
      navigate(`/pacientes/${savedId || id}`);
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Erro ao salvar paciente.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="loading-container">Carregando dados...</div>;

  return (
    <div className="patient-form-page">
      <div className="page-header-actions" style={{ justifyContent: 'flex-start', gap: '16px' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/pacientes')}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <h1 style={{ color: 'var(--primary-color)' }}>{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</h1>
      </div>

      <div className="tabs-container">
        <button type="button" className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`} onClick={() => setActiveTab('pessoal')}>
          <User size={18} style={{ marginRight: '8px' }} /> Pessoal
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`} onClick={() => setActiveTab('clinico')}>
          <Activity size={18} style={{ marginRight: '8px' }} /> Clínico
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`} onClick={() => setActiveTab('habitos')}>
          <Coffee size={18} style={{ marginRight: '8px' }} /> Hábitos
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        {activeTab === 'pessoal' && (
          <section className="form-section">
            <h2 className="form-section-title">Dados Pessoais</h2>
            <div className="form-grid">
              <div className="form-row">
                <label>Nome Completo *</label>
                <input name="nome" value={formData.nome} onChange={handleInputChange} required placeholder="Ex: Maria Souza" />
              </div>
              <div className="form-row">
                <label>Data de Nascimento {age !== null && <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>({age} anos)</span>}</label>
                <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} />
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
              <div className="form-row">
                <label>E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="email@exemplo.com" />
              </div>
              <div className="form-row">
                <label>Telefone</label>
                <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
              </div>
              <div className="form-row">
                <label>WhatsApp</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="(00) 00000-0000" />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'clinico' && (
          <section className="form-section">
            <h2 className="form-section-title">Dados Clínicos</h2>
            <div className="form-grid">
              <div className="form-row">
                <label>Peso Atual</label>
                <div className="input-with-unit">
                  <input type="number" step="0.1" name="peso_inicial" value={formData.peso_inicial} onChange={handleInputChange} />
                  <span className="unit">kg</span>
                </div>
              </div>
              <div className="form-row">
                <label>Altura</label>
                <div className="input-with-unit">
                  <input type="number" step="0.01" name="altura" value={formData.altura} onChange={handleInputChange} />
                  <span className="unit">cm</span>
                </div>
              </div>
              <div className="form-row">
                <label>IMC</label>
                <div className="imc-display">
                  {imc || '--'} {imc && <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>kg/m²</span>}
                </div>
              </div>
              <div className="form-row">
                <label>Nível de Atividade</label>
                <select name="nivel_atividade" value={formData.nivel_atividade} onChange={handleInputChange}>
                  <option value="Sedentário">Sedentário</option>
                  <option value="Levemente ativo">Levemente ativo</option>
                  <option value="Moderadamente ativo">Moderadamente ativo</option>
                  <option value="Muito ativo">Muito ativo</option>
                  <option value="Extremamente ativo">Extremamente ativo</option>
                </select>
              </div>
            </div>
            
            <div className="form-row" style={{ marginTop: '24px' }}>
              <label>Objetivo</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                  <label key={obj} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', backgroundColor: formData.objetivos.includes(obj) ? 'var(--accent-light)' : 'transparent', color: formData.objetivos.includes(obj) ? 'var(--accent-color)' : 'inherit', transition: 'all 0.2s' }}>
                    <input type="checkbox" checked={formData.objetivos.includes(obj)} onChange={() => handleArrayToggle('objetivos', obj)} style={{ display: 'none' }} />
                    {obj}
                  </label>
                ))}
              </div>
              <input name="objetivo_texto" value={formData.objetivo_texto} onChange={handleInputChange} placeholder="Outro objetivo ou observação..." style={{ marginTop: '12px' }} />
            </div>

            <div className="form-row" style={{ marginTop: '24px' }}>
              <label>Patologias / Condições</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {['Nenhum', 'Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', backgroundColor: formData.patologias.includes(item) ? 'var(--accent-light)' : 'transparent', color: formData.patologias.includes(item) ? 'var(--accent-color)' : 'inherit' }}>
                    <input type="checkbox" checked={formData.patologias.includes(item)} onChange={() => handleArrayToggle('patologias', item)} style={{ display: 'none' }} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '24px' }}>
              <label>Restrições / Alergias</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {['Glúten', 'Lactose', 'Açúcar', 'Amendoim', 'Ovo', 'Soja', 'Frutos do mar'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', backgroundColor: formData.restricoes_alimentares.includes(item) ? 'var(--accent-light)' : 'transparent', color: formData.restricoes_alimentares.includes(item) ? 'var(--accent-color)' : 'inherit' }}>
                    <input type="checkbox" checked={formData.restricoes_alimentares.includes(item)} onChange={() => handleArrayToggle('restricoes_alimentares', item)} style={{ display: 'none' }} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '24px' }}>
              <div className="form-row">
                <label>Medicamentos Contínuos</label>
                <textarea name="medicamentos" value={formData.medicamentos} onChange={handleInputChange} style={{ minHeight: '80px' }} />
              </div>
              <div className="form-row">
                <label>Suplementos em uso</label>
                <textarea name="suplementos" value={formData.suplementos} onChange={handleInputChange} style={{ minHeight: '80px' }} />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'habitos' && (
          <section className="form-section">
            <h2 className="form-section-title">Estilo de Vida e Hábitos</h2>
            <div className="form-grid">
              <div className="form-row">
                <label>Refeições por dia</label>
                <input type="number" name="refeicoes_por_dia" value={formData.refeicoes_por_dia} onChange={handleInputChange} />
              </div>
              <div className="form-row">
                <label>Quantidade de água</label>
                <div className="input-with-unit">
                  <input type="number" step="0.1" name="litros_agua" value={formData.litros_agua} onChange={handleInputChange} />
                  <span className="unit">litros</span>
                </div>
              </div>
              <div className="form-row">
                <label>Horário que acorda</label>
                <input 
                  placeholder="Ex: 600 ou 06:30" 
                  name="horario_acorda" 
                  value={formData.horario_acorda} 
                  onChange={handleInputChange} 
                  onBlur={(e) => setFormData(prev => ({ ...prev, horario_acorda: formatTime(e.target.value) }))}
                />
              </div>
              <div className="form-row">
                <label>Horário que dorme</label>
                <input 
                  placeholder="Ex: 2300 ou 23:00" 
                  name="horario_dorme" 
                  value={formData.horario_dorme} 
                  onChange={handleInputChange}
                  onBlur={(e) => setFormData(prev => ({ ...prev, horario_dorme: formatTime(e.target.value) }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" name="atividade_fisica" checked={formData.atividade_fisica} onChange={handleInputChange} />
                Pratica atividade física?
              </label>
              {formData.atividade_fisica && (
                <input 
                  name="atividade_fisica_descricao" 
                  value={formData.atividade_fisica_descricao} 
                  onChange={handleInputChange} 
                  placeholder="Qual atividade e frequência semanal?" 
                  style={{ marginTop: '12px' }}
                />
              )}
            </div>
            
            <div className="form-row" style={{ marginTop: '24px' }}>
              <label>Observações gerais</label>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} />
            </div>
          </section>
        )}

        <div className="form-actions">
          <div style={{ flex: 1 }}>
            {activeTab !== 'pessoal' && <button type="button" className="btn btn-secondary" onClick={() => setActiveTab(activeTab === 'habitos' ? 'clinico' : 'pessoal')}>Anterior</button>}
          </div>
          {activeTab !== 'habitos' ? (
            <button type="button" className="btn btn-primary" onClick={() => setActiveTab(activeTab === 'pessoal' ? 'clinico' : 'habitos')}>Próximo</button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ backgroundColor: 'var(--accent-color)' }}>
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {isEditing ? 'Atualizar Dados' : 'Finalizar Cadastro'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
