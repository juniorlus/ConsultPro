import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, Eye, Trash2, Edit2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalPatients: number;
  consultsThisWeek: number;
  patientsWithoutReturn: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    consultsThisWeek: 0,
    patientsWithoutReturn: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Total Patients
      const { count: patientCount } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('nutricionista_id', user?.id);

      // 2. Consultations this week
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
      const { count: consultCount } = await supabase
        .from('consultas')
        .select('*, pacientes!inner(nutricionista_id)', { count: 'exact', head: true })
        .eq('pacientes.nutricionista_id', user?.id)
        .gte('data_consulta', startOfWeek.toISOString().split('T')[0]);

      // 3. Patients Without Return
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: latestConsults } = await supabase
        .from('consultas')
        .select(`
          data_consulta,
          proximo_retorno,
          paciente_id,
          pacientes!inner (
            id,
            nome,
            nutricionista_id
          )
        `)
        .eq('pacientes.nutricionista_id', user?.id)
        .order('data_consulta', { ascending: false });

      const patientMap = new Map();
      latestConsults?.forEach(consult => {
        if (!patientMap.has(consult.paciente_id)) {
          patientMap.set(consult.paciente_id, consult);
        }
      });

      const withoutReturn = Array.from(patientMap.values())
        .filter(consult => {
          const consultDate = new Date(consult.data_consulta);
          return consultDate < thirtyDaysAgo && !consult.proximo_retorno;
        })
        .map(consult => ({
          id: consult.pacientes.id,
          nome: consult.pacientes.nome,
          lastConsult: consult.data_consulta
        }));

      setStats({
        totalPatients: patientCount || 0,
        consultsThisWeek: consultCount || 0,
        patientsWithoutReturn: withoutReturn,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Carregando dados...</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-color)' }}>
            <Plus size={40} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalPatients}</span>
            <span className="stat-label">Total de pacientes ativos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#0ea5e9' }}>
            <Calendar size={40} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.consultsThisWeek}</span>
            <span className="stat-label">Consultas da semana</span>
          </div>
        </div>
      </div>

      <div className="data-card">
        <h2 className="card-title">Pacientes sem retorno</h2>
        <p className="card-subtitle">Última consulta {'>'} 30 dias, sem retorno agendado</p>

        {stats.patientsWithoutReturn.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome do Paciente</th>
                <th>Última Consulta</th>
                <th>Próximo Passos</th>
                <th style={{ textAlign: 'center' }}>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {stats.patientsWithoutReturn.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <Link to={`/pacientes/${patient.id}`} className="patient-name-link">
                      {patient.nome}
                    </Link>
                  </td>
                  <td>{new Date(patient.lastConsult).toLocaleDateString('pt-BR')}</td>
                  <td>-</td>
                  <td>
                    <div className="action-icons" style={{ justifyContent: 'center' }}>
                      <Link to={`/pacientes/${patient.id}`} className="action-icon"><Eye size={18} /></Link>
                      <Link to={`/pacientes/edit/${patient.id}`} className="action-icon"><Edit2 size={18} /></Link>
                      <button className="action-icon" style={{ background: 'none', padding: 0 }}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            Nenhum paciente sem retorno no momento
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
