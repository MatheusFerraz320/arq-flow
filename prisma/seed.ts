import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const architect = await prisma.user.upsert({
    where: { email: 'arquiteto@arqflow.com' },
    update: {},
    create: {
      name: 'Arquiteto',
      email: 'arquiteto@arqflow.com',
      password: hashedPassword,
      role: Role.ARCHITECT,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'cliente@arqflow.com' },
    update: {},
    create: {
      name: 'Cliente',
      email: 'cliente@arqflow.com',
      password: hashedPassword,
      role: Role.CLIENT,
    },
  });

  const client = await prisma.client.upsert({
    where: { id: 'seed-client-1' },
    update: {},
    create: {
      id: 'seed-client-1',
      userId: architect.id,
      name: 'Maria Silva',
      email: 'maria@email.com',
      phone: '(11) 99999-8888',
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      clientId: client.id,
      title: 'Casa de Praia - Ubatuba',
      description: 'Projeto residencial de 200m² em condomínio fechado.',
    },
  });

  await prisma.projectUpdate.create({
    data: {
      projectId: project.id,
      message: 'Briefing concluído com o cliente.',
    },
  });

  await prisma.projectUpdate.create({
    data: {
      projectId: project.id,
      message: 'Primeira planta baixa enviada para revisão.',
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
