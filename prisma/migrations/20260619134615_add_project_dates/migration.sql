-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "budget" DECIMAL(65,30),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- npx prisma migrate dev --name nome do migrate , adicionar numero ou projeto_data coisas do tipo