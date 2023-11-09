/*
  Warnings:

  - A unique constraint covering the columns `[senderId,receiverId]` on the table `Dm` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Dm_senderId_receiverId_key" ON "Dm"("senderId", "receiverId");
