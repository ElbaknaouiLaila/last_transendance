/*
  Warnings:

  - Added the required column `status_User` to the `ChannelBan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChannelBan" ADD COLUMN     "status_User" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MemberChannel" ADD COLUMN     "muted" BOOLEAN;
