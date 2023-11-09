/*
  Warnings:

  - You are about to drop the column `name` on the `Freind` table. All the data in the column will be lost.
  - Made the column `id_freind` on table `Freind` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Freind" DROP COLUMN "name",
ALTER COLUMN "id_freind" SET NOT NULL;

-- CreateTable
CREATE TABLE "ChannelBan" (
    "bannedUserId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,

    CONSTRAINT "ChannelBan_pkey" PRIMARY KEY ("bannedUserId","channelId")
);

-- AddForeignKey
ALTER TABLE "ChannelBan" ADD CONSTRAINT "ChannelBan_bannedUserId_channelId_fkey" FOREIGN KEY ("bannedUserId", "channelId") REFERENCES "MemberChannel"("userId", "channelId") ON DELETE RESTRICT ON UPDATE CASCADE;
