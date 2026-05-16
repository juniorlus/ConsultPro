import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Eye, Edit2, User as UserIcon, Calendar, X, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface Patient {
  id: string;
  nome: string;
  objetivos: string[];
  last_consult?: string;
}

const Patients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const emptyForm = {
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    observacoes: '',
    objetivos: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data: patientsData, error: patientsError } = await supabase
        .from('pacientes')
        .select('id, nome, objetivos')
        .eq('nutricionista_id', user?.id)
        .order('nome', { ascending: true });

      if (patientsError) throw patientsError;

      const { data: consultsData } = await supabase
        .from('consultas')
        .select('paciente_id, data_consulta')
        .order('data_consulta', { ascending: false });

      const lastConsultMap = new Map();
      consultsData?.forEach(c => {
        if (!lastConsultMap.has(c.paciente_id)) {
          lastConsultMap.set(c.paciente_id, c.data_consulta);
        }
      });

      const enrichedPatients = (patientsData || []).map(p => ({
        ...p,
        last_consult: lastConsultMap.get(p.id)
      }));

      setPatients(enrichedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModalClose = () => {
    setShowModal(false);
    setForm(emptyForm);
    setSaved(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleObjectivoToggle = (obj: string) => {
    setForm(prev => ({
      ...prev,
      objetivos: prev.objetivos.includes(obj)
        ? prev.objetivos.filter(o => o !== obj)
        : [...prev.objetivos, obj]
    }));
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return alert('O nome é obrigatório.');
    setSaving(true);

    try {
      const h = parseFloat(form.altura);
      const payload = {
        nome: form.nome,
        data_nascimento: form.data_nascimento || null,
        sexo: form.sexo || null,
        telefone: form.telefone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        peso_inicial: form.peso_inicial ? parseFloat(form.peso_inicial) : null,
        altura: h ? (h > 3 ? h / 100 : h) : null,
        observacoes: form.observacoes || null,
        objetivos: form.objetivos,
        nutricionista_id: user?.id,
      };

      const { data, error } = await supabase.from('pacientes').insert([payload]).select().single();
      if (error) throw error;

      setSaved(true);
      await fetchPatients();

      // Aguarda um momento e redireciona para o perfil
      setTimeout(() => {
        handleModalClose();
        navigate(`/pacientes/${data.id}`);
      }, 1200);

    } catch (error) {
      console.error('Error saving:', error);
      alert('Erro ao cadastrar paciente. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="patients-page">
      <div className="page-header-actions">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Novo Paciente
        </button>
      </div>

      <div className="data-card">
        <h2 className="card-title">Listagem de Pacientes</h2>

        {loading ? (
          <div className="empty-state">Carregando...</div>
        ) : filteredPatients.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Objetivo</th>
                <th>Última Consulta</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/pacientes/${patient.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                        <UserIcon size={16} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{patient.nome}</span>
                    </div>
                  </td>
                  <td>
                    {patient.objetivos && patient.objetivos.length > 0 ? (
                      <span className="badge badge-info">{patient.objetivos[0]}</span>
                    ) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.9rem' }}>
                      <Calendar size={14} />
                      {patient.last_consult ? new Date(patient.last_consult + 'T12:00:00').toLocaleDateString('pt-BR') : 'Nunca consultou'}
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-icons" style={{ justifyContent: 'center' }}>
                      <Link to={`/pacientes/${patient.id}`} className="action-icon"><Eye size={18} /></Link>
                      <Link to={`/pacientes/editar/${patient.id}`} className="action-icon"><Edit2 size={18} /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            {searchTerm ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
          </div>
        )}
      </div>

      {/* Modal de Cadastro Rápido */}
      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {saved ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle size={64} color="var(--accent-color)" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Paciente Cadastrado!</h2>
                <p style={{ color: 'var(--text-muted)' }}>Redirecionando para o perfil...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Novo Paciente</h2>
                  <button className="action-icon" onClick={handleModalClose}><X size={22} /></button>
                </div>

                <form onSubmit={handleSaveNew}>
                  {/* Dados Pessoais */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Dados Pessoais</h3>
                    <div className="form-grid">
                      <div className="form-row" style={{ gridColumn: 'span 2' }}>
                        <label>Nome Completo *</label>
                        <input
                          name="nome"
                          value={form.nome}
                          onChange={handleFormChange}
                          placeholder="Ex: Maria Souza"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="form-row">
                        <label>Data de Nascimento</label>
                        <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleFormChange} />
                      </div>
                      <div className="form-row">
                        <label>Sexo</label>
                        <select name="sexo" value={form.sexo} onChange={handleFormChange}>
                          <option value="">Selecione</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="form-row">
                        <label>Telefone / WhatsApp</label>
                        <input name="telefone" value={form.telefone} onChange={handleFormChange} placeholder="(00) 00000-0000" />
                      </div>
                      <div className="form-row">
                        <label>E-mail</label>
                        <input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="email@exemplo.com" />
                      </div>
                    </div>
                  </div>

                  {/* Dados Clínicos */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Dados Clínicos</h3>
                    <div className="form-grid">
                      <div className="form-row">
                        <label>Peso Inicial (kg)</label>
                        <input type="number" step="0.1" name="peso_inicial" value={form.peso_inicial} onChange={handleFormChange} placeholder="Ex: 72.5" />
                      </div>
                      <div className="form-row">
                        <label>Altura (m ou cm)</label>
                        <input type="number" step="0.01" name="altura" value={form.altura} onChange={handleFormChange} placeholder="Ex: 1.65 ou 165" />
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Objetivos</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Emagrecer', 'Ganhar massa', 'Saúde geral', 'Performance'].map(obj => (
                          <button
                            key={obj}
                            type="button"
                            onClick={() => handleObjectivoToggle(obj)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: form.objetivos.includes(obj) ? '2px solid var(--accent-color)' : '1px solid #e2e8f0',
                              backgroundColor: form.objetivos.includes(obj) ? 'var(--accent-light, #ecfdf5)' : 'white',
                              color: form.objetivos.includes(obj) ? 'var(--accent-color)' : '#64748b',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            {obj}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="form-row" style={{ marginBottom: '24px' }}>
                    <label>Observações</label>
                    <textarea
                      name="observacoes"
                      value={form.observacoes}
                      onChange={handleFormChange}
                      placeholder="Alergias, restrições, medicamentos..."
                      style={{ minHeight: '80px' }}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleModalClose}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: '160px' }}>
                      {saving ? 'Salvando...' : '✓ Cadastrar Paciente'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
