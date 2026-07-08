/*
  Warnings:

  - A unique constraint covering the columns `[id,userId]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'INTERIORES', 'REFORMA', 'URBANISMO', 'OUTRO');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "type" "ProjectType";

-- CreateIndex
CREATE UNIQUE INDEX "clients_id_userId_key" ON "clients"("id", "userId");
