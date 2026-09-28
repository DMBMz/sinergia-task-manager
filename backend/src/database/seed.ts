import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[Seed] Criando dados iniciais no PostgreSQL...');
      const passwordHash = await bcrypt.hash('sinergia123', 10);
      
      const userDavi = await prisma.user.create({
        data: {
          id: '0f9dbe45-1ab2-4003-ac68-1fc5d4d4fb91',
          name: 'Davi Marinho',
          email: 'davi@sinergia.com',
          passwordHash,
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Davi%20Marinho'
        }
      });

      const userAna = await prisma.user.create({
        data: {
          id: 'user-ana-002',
          name: 'Ana Silva',
          email: 'ana@sinergia.com',
          passwordHash,
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana%20Silva'
        }
      });

      const project = await prisma.project.create({
        data: {
          id: 'a316a12f-a66b-4ed4-b8c2-c64bcc624d17',
          name: 'Equipe Alpha Sinergia',
          description: 'Time Principal',
          color: '#2563EB'
        }
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: userDavi.id,
          role: 'ADMIN'
        }
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: userAna.id,
          role: 'EDIT'
        }
      });

      console.log('[Seed] Dados iniciais inseridos com sucesso!');
    }
  } catch (err) {
    console.warn('[Seed] Aviso na inicialização de dados:', err);
  }
}

if (require.main === module) {
  seedDatabase().then(() => prisma.$disconnect());
}
