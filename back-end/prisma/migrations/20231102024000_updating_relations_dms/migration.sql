/*
  Warnings:

  - You are about to drop the column `recieverId` on the `Dm` table. All the data in the column will be lost.
  - Added the required column `receiverId` to the `Dm` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dm" DROP COLUMN "recieverId",
ADD COLUMN     "receiverId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Dm" ADD CONSTRAINT "Dm_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
