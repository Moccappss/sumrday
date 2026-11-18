import React, { useState, useMemo } from 'react';
import { 
  Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight, 
  Filter, Sparkles, TrendingUp, User, Tag, Zap, Check, Eye
} from 'lucide-react';

interface TimelineGanttViewProps {
  projects: any[];
  onSelect: (project: any) => void;
  updateProject: (id: string, updates: any) => void;
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  projects,
  onSelect,
  updateProject,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'progress' | 'review' | 'done'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const filteredProjects = useMemo(() => {
    return (projects || [])
      .filter(p => !p.isTrash && !p.isDeleted)
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return da - db;
      });
  }, [projects, statusFilter]);

  const getDaysLeft = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return { label: 'Selesai', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'progress':
        return { label: 'In Progress', bg: 'rgba(99, 102, 241, 0.15)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' };
      case 'review':
        return { label: 'Review Klien', bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      default:
        return { label: 'To Do', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      width: '100%',
      minHeight: '100%',
      boxSizing: 'border-box',
      paddingBottom: 24
    }}>
      {/* Top Filter & Milestone Control Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        background: 'var(--cms-card-bg)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: 16,
        padding: '12px 18px',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'var(--cms-accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>
              Milestone & Gantt Timeline Tracker
            </div>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
              Pantau jadwal, tahapan sprint, & progres deliverable proyek agensi secara visual
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Semua Proyek' },
            { id: 'progress', label: 'In Progress' },
            { id: 'review', label: 'Review' },
            { id: 'todo', label: 'To Do' },
            { id: 'done', label: 'Selesai' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: 100,
                border: '1px solid',
                borderColor: statusFilter === s.id ? 'var(--cms-accent)' : 'var(--glass-border)',
                background: statusFilter === s.id ? 'var(--cms-accent)' : 'transparent',
                color: statusFilter === s.id ? '#ffffff' : 'var(--cms-text-muted)',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Card List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredProjects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: 'var(--cms-card-bg)',
            borderRadius: 20,
            border: '1px dashed var(--glass-border)',
            color: 'var(--cms-text-muted)'
          }}>
            <Clock size={36} style={{ opacity: 0.4, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>Tidak ada proyek yang sesuai filter</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Ubah filter status atau tambahkan proyek baru di tombol "+ Tambah".</div>
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const badge = getStatusBadge(proj.status);
            const daysLeft = getDaysLeft(proj.dueDate);
            const tasks = Array.isArray(proj.tasks) ? proj.tasks : [];
            const completedTasks = tasks.filter(t => t.completed).length;
            const calculatedProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : (proj.progress || 0);

            return (
              <div
                key={proj.id}
                style={{
                  background: 'var(--cms-card-bg)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 20,
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: 'var(--cms-shadow-sm)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header Proyek */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: 100,
                      background: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                      fontSize: 11,
                      fontWeight: 850,
                      flexShrink: 0
                    }}>
                      {badge.label}
                    </div>
                    <div>
                      <div 
                        onClick={() => onSelect(proj)}
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: 'var(--cms-text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span style={{ textDecoration: 'none' }}>{proj.title}</span>
                        <ChevronRight size={14} color="var(--cms-text-muted)" />
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {proj.client && <span>👤 <strong>{proj.client}</strong></span>}
                        {proj.dueDate && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} /> Deadline: {new Date(proj.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deadline Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {daysLeft !== null && (
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 800,
                        background: daysLeft < 0 ? 'rgba(239, 68, 68, 0.15)' : daysLeft <= 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: daysLeft < 0 ? '#ef4444' : daysLeft <= 3 ? '#f59e0b' : '#10b981',
                        border: `1px solid ${daysLeft < 0 ? 'rgba(239, 68, 68, 0.3)' : daysLeft <= 3 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {daysLeft < 0 ? `⚠️ Lewat ${Math.abs(daysLeft)} hari` : daysLeft === 0 ? '🔥 Hari ini!' : `⏳ ${daysLeft} hari lagi`}
                      </div>
                    )}
                    <button
                      onClick={() => onSelect(proj)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 10,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--cms-input-bg)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Eye size={13} />
                      Detail
                    </button>
                  </div>
                </div>

                {/* Visual Progress Bar (Gantt Phase Bar) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)' }}>
                      PROGRES SPRINT: {completedTasks} DARI {tasks.length} SUBTASK
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-text)' }}>
                      {calculatedProgress}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 100,
                    background: 'var(--cms-switcher-bg, rgba(255,255,255,0.08))',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${calculatedProgress}%`,
                      height: '100%',
                      borderRadius: 100,
                      background: calculatedProgress === 100 
                        ? 'linear-gradient(90deg, #10b981, #059669)' 
                        : 'linear-gradient(90deg, var(--cms-accent), #8b5cf6)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Subtasks Milestone Pills */}
                {tasks.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--glass-border)'
                  }}>
                    {tasks.map((task: any, tIdx: number) => (
                      <div
                        key={task.id || tIdx}
                        onClick={() => {
                          const updatedTasks = tasks.map((t: any, i: number) => 
                            i === tIdx ? { ...t, completed: !t.completed } : t
                          );
                          const newProgress = Math.round((updatedTasks.filter((t: any) => t.completed).length / updatedTasks.length) * 100);
                          updateProject(proj.id, {
                            tasks: updatedTasks,
                            progress: newProgress,
                            status: newProgress === 100 ? 'done' : (proj.status === 'done' ? 'progress' : proj.status)
                          });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 12px',
                          borderRadius: 10,
                          background: task.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--cms-input-bg)',
                          border: `1px solid ${task.completed ? 'rgba(16, 185, 129, 0.25)' : 'var(--glass-border)'}`,
                          cursor: 'pointer',
                          fontSize: 12,
                          color: task.completed ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          borderRadius: 5,
                          border: `1.5px solid ${task.completed ? '#10b981' : 'var(--cms-text-muted)'}`,
                          background: task.completed ? '#10b981' : 'transparent',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {task.completed && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TimelineGanttView;
