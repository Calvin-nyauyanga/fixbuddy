-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'response';

-- AlterTable
ALTER TABLE "tickets" ALTER COLUMN "category" SET DEFAULT 'General';

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "ticketId" INTEGER,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
