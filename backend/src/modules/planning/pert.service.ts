export interface PokerVote {
  userId: string;
  userName: string;
  points: number; // Ex: 1, 2, 3, 5, 8, 13, 21 (Fibonacci)
  votedAt: Date;
}

export interface PertResult {
  optimistic: number;      // O
  mostLikely: number;      // M
  pessimistic: number;     // P
  expectedHours: number;   // E = (O + 4M + P) / 6
  standardDeviation: number; // sigma = (P - O) / 6
  variance: number;        // sigma^2
}

export interface PokerSessionSummary {
  taskId: string;
  votesCount: number;
  revealed: boolean;
  votes: PokerVote[];
  consensusPoints?: number;
  average: number;
  median: number;
  pertEstimate: PertResult;
  agreementPercentage: number;
}

export class PlanningPokerService {
  private static sessions = new Map<string, { revealed: boolean; votes: Map<string, PokerVote> }>();

  /**
   * Cálculo clássico PERT (Program Evaluation and Review Technique)
   */
  static calculatePert(optimistic: number, mostLikely: number, pessimistic: number): PertResult {
    const o = Math.max(0.5, optimistic);
    const m = Math.max(o, mostLikely);
    const p = Math.max(m, pessimistic);

    const expectedHours = Number(((o + (4 * m) + p) / 6).toFixed(2));
    const standardDeviation = Number(((p - o) / 6).toFixed(2));
    const variance = Number((standardDeviation * standardDeviation).toFixed(2));

    return {
      optimistic: o,
      mostLikely: m,
      pessimistic: p,
      expectedHours,
      standardDeviation,
      variance
    };
  }

  /**
   * Registra voto de Planning Poker de um membro para uma tarefa
   */
  static vote(taskId: string, userId: string, userName: string, points: number): PokerVote {
    if (!this.sessions.has(taskId)) {
      this.sessions.set(taskId, { revealed: false, votes: new Map() });
    }

    const session = this.sessions.get(taskId)!;
    const vote: PokerVote = {
      userId,
      userName,
      points,
      votedAt: new Date()
    };
    session.votes.set(userId, vote);
    return vote;
  }

  /**
   * Revela os votos da sessão
   */
  static revealVotes(taskId: string): boolean {
    const session = this.sessions.get(taskId);
    if (!session) return false;
    session.revealed = true;
    return true;
  }

  /**
   * Obtém o resumo dos votos e calcula a estimativa PERT a partir dos dados do Planning Poker
   */
  static getSessionSummary(taskId: string): PokerSessionSummary {
    const session = this.sessions.get(taskId) || { revealed: false, votes: new Map() };
    const voteList = Array.from(session.votes.values());

    if (voteList.length === 0) {
      return {
        taskId,
        votesCount: 0,
        revealed: session.revealed,
        votes: [],
        average: 0,
        median: 0,
        pertEstimate: this.calculatePert(1, 1, 1),
        agreementPercentage: 0
      };
    }

    const values = voteList.map(v => v.points).sort((a, b) => a - b);
    const sum = values.reduce((acc, cur) => acc + cur, 0);
    const average = Number((sum / values.length).toFixed(1));

    // Mediana
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 !== 0 ? values[mid] : Number(((values[mid - 1] + values[mid]) / 2).toFixed(1));

    // Estimação PERT usando os extremos e a mediana como Most Likely
    const optimistic = values[0];
    const mostLikely = median;
    const pessimistic = values[values.length - 1];
    const pert = this.calculatePert(optimistic, mostLikely, pessimistic);

    // Percentual de concordância (quantos votaram na moda ou muito próximo)
    const modalValue = mostLikely;
    const matchingVotes = values.filter(v => Math.abs(v - modalValue) <= 1).length;
    const agreementPercentage = Math.round((matchingVotes / values.length) * 100);

    return {
      taskId,
      votesCount: voteList.length,
      revealed: session.revealed,
      votes: session.revealed ? voteList : voteList.map(v => ({ ...v, points: -1 })), // Oculta pontos se não revelado
      consensusPoints: modalValue,
      average,
      median,
      pertEstimate: pert,
      agreementPercentage
    };
  }

  /**
   * Limpa a sessão de poker de uma tarefa
   */
  static clearSession(taskId: string): void {
    this.sessions.delete(taskId);
  }
}
