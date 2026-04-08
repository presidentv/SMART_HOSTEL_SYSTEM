-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "specialization" TEXT NOT NULL DEFAULT 'CLEANING',
    "tasks_handled" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "StaffProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StaffProfile" ("id", "is_available", "tasks_handled", "user_id") SELECT "id", "is_available", "tasks_handled", "user_id" FROM "StaffProfile";
DROP TABLE "StaffProfile";
ALTER TABLE "new_StaffProfile" RENAME TO "StaffProfile";
CREATE UNIQUE INDEX "StaffProfile_user_id_key" ON "StaffProfile"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
