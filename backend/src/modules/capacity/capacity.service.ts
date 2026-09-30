import { Task, User, UserAbsence } from '../../database/types';
import { repository } from '../../database/repository';

export interface MemberWorkload {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  totalAllocatedHours: number;
  maxWeeklyCapacity: number; // Padrão: 40h
  availableHours: number;
  utilizationPercentage: number;
  status: 'AVAILABLE' | 'OPTIMAL' | 'OVERLOADED' | 'ON_LEAVE';
  isOnLeave: boolean;
  leaveType?: string;
  leaveReason?: string | null;
  activeTasksCount: number;
}

export interface AssigneeRecommendation {
  userId: string;
  userName: string;
  score: number; // 0 a 100
  currentWorkloadHours: number;
  status: 'AVAILABLE' | 'OPTIMAL' | 'OVERLOADED' | 'ON_LEAVE';
  isRecommended: boolean;
  reason: string;
}

export class CapacityService {
  private static MAX_WEEKLY_HOURS = 40;

  /**
   * Obtém a data de início e fim da semana (Segunda a Domingo) para uma dada data de referência
   */
  static getWeekRange(refDate: Date = new Date()): { start: Date; end: Date } {
    const d = new Date(refDate);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diffToMonday));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Calcula a carga horária de trabalho e capacidade de um membro em uma determinada semana (BE-09.1)
   */
  static getMemberWorkload(userId: string, weekDate: Date = new Date()): MemberWorkload {
    const user = repository.getUserById(userId);
    const userName = user?.name || 'Membro';
    const avatarUrl = user?.avatarUrl;

    const { start: weekStart, end: weekEnd } = this.getWeekRange(weekDate);

    // 1. Verifica ausências / férias do membro
    const absences = repository.getUserAbsences(userId);
    const currentAbsence = absences.find(a => {
      const aStart = new Date(a.startDate).getTime();
      const aEnd = new Date(a.endDate).getTime();
      return (weekStart.getTime() <= aEnd && weekEnd.getTime() >= aStart);
    });

    const isOnLeave = Boolean(currentAbsence);

    // 2. Busca tarefas ativas atribuídas ao membro com prazo ou início na semana
    const allTasks = repository.getAllTasks({ assigneeId: userId });
    const activeTasks = allTasks.filter(t => {
      if (t.status === 'COMPLETED') return false;
      if (!t.dueDate) return true; // Tarefas sem data contam como backlog ativo
      const due = new Date(t.dueDate).getTime();
      return due >= weekStart.getTime() && due <= weekEnd.getTime();
    });

    const totalAllocatedHours = activeTasks.reduce((sum, t) => sum + (t.effortHours || 0), 0);
    const availableHours = Math.max(0, this.MAX_WEEKLY_HOURS - totalAllocatedHours);
    const utilizationPercentage = Math.round((totalAllocatedHours / this.MAX_WEEKLY_HOURS) * 100);

    let status: 'AVAILABLE' | 'OPTIMAL' | 'OVERLOADED' | 'ON_LEAVE' = 'AVAILABLE';
    if (isOnLeave) {
      status = 'ON_LEAVE';
    } else if (totalAllocatedHours > this.MAX_WEEKLY_HOURS) {
      status = 'OVERLOADED';
    } else if (totalAllocatedHours >= 30) {
      status = 'OPTIMAL';
    } else {
      status = 'AVAILABLE';
    }

    return {
      userId,
      userName,
      avatarUrl,
      totalAllocatedHours,
      maxWeeklyCapacity: this.MAX_WEEKLY_HOURS,
      availableHours,
      utilizationPercentage,
      status,
      isOnLeave,
      leaveType: currentAbsence?.type,
      leaveReason: currentAbsence?.reason,
      activeTasksCount: activeTasks.length
    };
  }

  /**
   * Matriz de Carga de Trabalho da Equipe (BE-12.1 / US12)
   */
  static getTeamWorkloadMatrix(teamName?: string, weekDate: Date = new Date()): MemberWorkload[] {
    const users = repository.getAllUsers();
    return users.map(u => this.getMemberWorkload(u.id, weekDate));
  }

  /**
   * Recomenda o melhor responsável para uma tarefa com base na carga atual, ausências e afinidade (BE-09.1)
   */
  static suggestAssignee(task: { effortHours?: number; dueDate?: Date; tags?: string[] }, teamMembers?: User[]): AssigneeRecommendation[] {
    const members = teamMembers && teamMembers.length > 0 ? teamMembers : repository.getAllUsers();
    const taskDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const taskHours = task.effortHours || 8;

    const recommendations: AssigneeRecommendation[] = members.map(member => {
      const workload = this.getMemberWorkload(member.id, taskDueDate);

      // Se estiver ausente/férias, pontuação 0 com bloqueio
      if (workload.isOnLeave) {
        return {
          userId: member.id,
          userName: member.name,
          score: 0,
          currentWorkloadHours: workload.totalAllocatedHours,
          status: 'ON_LEAVE',
          isRecommended: false,
          reason: `Ausente por ${workload.leaveReason || workload.leaveType || 'férias'} no período da tarefa.`
        };
      }

      // Pontuação de disponibilidade (quanto mais horas livres de 40h, melhor)
      const projectedTotal = workload.totalAllocatedHours + taskHours;
      let score = 50;

      if (projectedTotal > this.MAX_WEEKLY_HOURS) {
        score = Math.max(10, 50 - (projectedTotal - this.MAX_WEEKLY_HOURS) * 3);
      } else {
        score = 50 + Math.round(((this.MAX_WEEKLY_HOURS - projectedTotal) / this.MAX_WEEKLY_HOURS) * 40);
      }

      // Bônus de afinidade por tags (se o usuário já concluiu tarefas com tags semelhantes)
      if (task.tags && task.tags.length > 0) {
        const completedUserTasks = repository.getAllTasks({ assigneeId: member.id, status: 'COMPLETED' });
        const hasTagAffinity = completedUserTasks.some(t => {
          const userTags = (t.tags || []).map((x: any) => (typeof x === 'string' ? x : x.name || '').toLowerCase());
          return task.tags!.some(tag => userTags.includes(tag.toLowerCase()));
        });
        if (hasTagAffinity) {
          score = Math.min(100, score + 10);
        }
      }

      let reason = `Capacidade disponível (${workload.availableHours}h livres esta semana).`;
      if (projectedTotal > this.MAX_WEEKLY_HOURS) {
        reason = `Atenção: Sobrecarga projetada (${projectedTotal}h/40h).`;
      } else if (score >= 80) {
        reason = `Excelente disponibilidade e histórico compatível com o escopo.`;
      }

      return {
        userId: member.id,
        userName: member.name,
        score,
        currentWorkloadHours: workload.totalAllocatedHours,
        status: workload.status,
        isRecommended: false,
        reason
      };
    });

    // Ordena da maior pontuação para a menor
    recommendations.sort((a, b) => b.score - a.score);

    // Marca o primeiro com score > 0 como o recomendado
    if (recommendations.length > 0 && recommendations[0].score > 0) {
      recommendations[0].isRecommended = true;
    }

    return recommendations;
  }
}
