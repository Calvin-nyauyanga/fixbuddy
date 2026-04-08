-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "estimatedResolutionTime" JSONB,
ADD COLUMN     "intelligenceData" JSONB,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "sentiment" JSONB,
ADD COLUMN     "suggestedAgent" TEXT,
ADD COLUMN     "userId" TEXT;
