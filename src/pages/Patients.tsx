import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Eye, Edit2, User as UserIcon, Calendar } from 'lucide-react';
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

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Get patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('pacientes')
        .select('id, nome, objetivos')
        .eq('nutricionista_id', user?.id)
        .order('nome', { ascending: true });

      if (patientsError) throw patientsError;

      // Get last consultation for each patient
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

      const enrichedPatients = patientsData.map(p => ({
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

        <button className="btn btn-primary" onClick={() => navigate('/pacientes/novo')}>
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
                      {patient.last_consult ? new Date(patient.last_consult).toLocaleDateString('pt-BR') : 'Nunca consultou'}
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
    </div>
  );
};

export default Patients;
