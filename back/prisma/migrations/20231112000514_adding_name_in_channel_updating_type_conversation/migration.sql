/*
  Warnings:

  - Changed the type of `outgoing` on the `Conversation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `incoming` on the `Conversation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "img" TEXT;

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "outgoing",
ADD COLUMN     "outgoing" INTEGER NOT NULL,
DROP COLUMN "incoming",
ADD COLUMN     "incoming" INTEGER NOT NULL;
