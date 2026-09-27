import { LocalTask } from '../database/schema';

export class LocalSearchIndex {
  // Índice invertido: termo normalizado -> Set de IDs de tarefas
  private invertedIndex: Map<string, Set<string>> = new Map();
  private taskTerms: Map<string, string[]> = new Map();

  /**
   * Normaliza texto: remove pontuação, acentuação e transforma em minúsculas
   */
  private normalize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacríticos/acentos
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /**
   * Calcula distância de Levenshtein para tolerância a erros ortográficos
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substituição
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // inserção / deleção
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Indexa uma lista de tarefas no índice invertido
   */
  indexTasks(tasks: LocalTask[]) {
    this.invertedIndex.clear();
    this.taskTerms.clear();

    for (const task of tasks) {
      const fullText = `${task.title} ${task.description || ''} ${task.priority} ${task.status}`;
      const terms = this.normalize(fullText);
      this.taskTerms.set(task.id, terms);

      for (const term of terms) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Set());
        }
        this.invertedIndex.get(term)!.add(task.id);
      }
    }
  }

  /**
   * Realiza busca tolerante a erros ortográficos (Fuzzy Search)
   */
  search(query: string, allTasks: LocalTask[]): { task: LocalTask; score: number }[] {
    const queryTerms = this.normalize(query);
    if (queryTerms.length === 0) {
      return allTasks.map(t => ({ task: t, score: 1 }));
    }

    const taskScores: Map<string, number> = new Map();

    for (const qTerm of queryTerms) {
      for (const [indexedTerm, taskIds] of this.invertedIndex.entries()) {
        let matchScore = 0;

        // Correspondência exata
        if (indexedTerm === qTerm) {
          matchScore = 3.0;
        }
        // Prefixo
        else if (indexedTerm.startsWith(qTerm) || qTerm.startsWith(indexedTerm)) {
          matchScore = 2.0;
        }
        // Tolerância ortográfica por Levenshtein (erros de digitação)
        else {
          const maxDistance = qTerm.length > 5 ? 2 : 1;
          const dist = this.levenshteinDistance(qTerm, indexedTerm);
          if (dist <= maxDistance) {
            matchScore = 1.5 / (dist + 1);
          }
        }

        if (matchScore > 0) {
          for (const taskId of taskIds) {
            const currentScore = taskScores.get(taskId) || 0;
            taskScores.set(taskId, currentScore + matchScore);
          }
        }
      }
    }

    const results: { task: LocalTask; score: number }[] = [];
    for (const [taskId, score] of taskScores.entries()) {
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        results.push({ task, score });
      }
    }

    // Ordena pelo maior score de relevância
    return results.sort((a, b) => b.score - a.score);
  }
}

export const searchIndex = new LocalSearchIndex();
