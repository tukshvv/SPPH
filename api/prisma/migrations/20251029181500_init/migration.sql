-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TokenUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interactionId" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL,
    CONSTRAINT "TokenUsage_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TokenUsage" ("completionTokens", "costUsd", "id", "interactionId", "promptTokens") SELECT "completionTokens", "costUsd", "id", "interactionId", "promptTokens" FROM "TokenUsage";
DROP TABLE "TokenUsage";
ALTER TABLE "new_TokenUsage" RENAME TO "TokenUsage";
CREATE UNIQUE INDEX "TokenUsage_interactionId_key" ON "TokenUsage"("interactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
