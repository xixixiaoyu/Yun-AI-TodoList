-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "deletedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiModel" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "aiTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "aiMaxTokens" INTEGER NOT NULL DEFAULT 1000,
    "autoAnalyze" BOOLEAN NOT NULL DEFAULT true,
    "priorityAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "timeEstimation" BOOLEAN NOT NULL DEFAULT true,
    "subtaskSplitting" BOOLEAN NOT NULL DEFAULT true,
    "desktopNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "dueReminder" BOOLEAN NOT NULL DEFAULT true,
    "reminderMinutes" INTEGER NOT NULL DEFAULT 30,
    "searchLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "safeSearch" BOOLEAN NOT NULL DEFAULT true,
    "defaultResultCount" INTEGER NOT NULL DEFAULT 10,
    "searchEngine" TEXT NOT NULL DEFAULT 'google',
    "searchRegion" TEXT NOT NULL DEFAULT 'CN',
    "storageMode" TEXT NOT NULL DEFAULT 'hybrid',
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER NOT NULL DEFAULT 5,
    "offlineMode" BOOLEAN NOT NULL DEFAULT true,
    "conflictResolution" TEXT NOT NULL DEFAULT 'merge',
    "retryAttempts" INTEGER NOT NULL DEFAULT 3,
    "requestTimeout" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "priority" INTEGER,
    "estimatedTime" INTEGER,
    "aiAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "aiReasoning" TEXT,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_users_last_active" ON "users"("lastActiveAt");

-- CreateIndex
CREATE INDEX "idx_users_soft_delete" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_users_account_status" ON "users"("accountStatus");

-- CreateIndex
CREATE INDEX "idx_users_email_verified" ON "users"("emailVerified");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "idx_user_preferences_user_id" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "idx_user_preferences_theme" ON "user_preferences"("theme");

-- CreateIndex
CREATE INDEX "idx_user_preferences_language" ON "user_preferences"("language");

-- CreateIndex
CREATE INDEX "idx_todos_user_status_due" ON "todos"("userId", "completed", "dueDate");

-- CreateIndex
CREATE INDEX "idx_todos_user_created" ON "todos"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_todos_user_status_priority" ON "todos"("userId", "completed", "priority");

-- CreateIndex
CREATE INDEX "idx_todos_user_title_status" ON "todos"("userId", "title", "completed");

-- CreateIndex
CREATE INDEX "idx_todos_priority" ON "todos"("priority");

-- CreateIndex
CREATE INDEX "idx_todos_soft_delete" ON "todos"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_email_codes_lookup" ON "email_verification_codes"("email", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_email_codes_code" ON "email_verification_codes"("code");

-- CreateIndex
CREATE INDEX "idx_email_codes_expires" ON "email_verification_codes"("expiresAt");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
