-- CreateTable
CREATE TABLE "saveBanned" (
    "id" SERIAL NOT NULL,
    "bannedUserId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "status_User" TEXT NOT NULL,

    CONSTRAINT "saveBanned_pkey" PRIMARY KEY ("id")
);
