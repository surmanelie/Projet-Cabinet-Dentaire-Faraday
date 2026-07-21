-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RH', 'PRATICIEN', 'ASSISTANT', 'COMPTABLE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('TEMPS_PLEIN', 'TEMPS_PARTIEL', 'AUTRE');

-- CreateEnum
CREATE TYPE "WorkEntryStatus" AS ENUM ('PRE_REMPLI', 'CONFIRME', 'MODIFIE', 'A_VALIDER', 'VALIDE', 'REFUSE', 'CORRIGE', 'VERROUILLE');

-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('CONGE_PAYE', 'ARRET_MALADIE', 'ABSENCE_EXCEPTIONNELLE', 'ABSENCE_NON_REMUNEREE', 'FORMATION', 'RECUPERATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('DEMANDE', 'ACCEPTE', 'REFUSE', 'ANNULE');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('AJOUT', 'DEDUCTION', 'CORRECTION_ADMIN');

-- CreateEnum
CREATE TYPE "MonthlyValidationStatus" AS ENUM ('EN_PREPARATION', 'ENVOYE_AU_SALARIE', 'VALIDE_SALARIE', 'REFUSE_SALARIE', 'VALIDE_RH', 'VERROUILLE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PDF_MENSUEL_SALARIE', 'PDF_GLOBAL_COMPTABLE', 'CSV_COMPTABLE');

-- CreateEnum
CREATE TYPE "ClockAction" AS ENUM ('DEBUT_JOURNEE', 'DEBUT_PAUSE', 'FIN_PAUSE', 'FIN_JOURNEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3f7e75',
    "clockPinHash" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "inviteToken" TEXT,
    "inviteTokenExpiresAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PractitionerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialty" TEXT,
    "room" TEXT,
    "notes" TEXT,

    CONSTRAINT "PractitionerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL DEFAULT 'TEMPS_PLEIN',
    "weeklyContractHours" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "startDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "AssistantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantPractitionerAssignment" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AssistantPractitionerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Horaire type',
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "plannedStart" TEXT,
    "plannedEnd" TEXT,
    "actualStart" TEXT,
    "actualEnd" TEXT,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "WorkEntryStatus" NOT NULL DEFAULT 'PRE_REMPLI',
    "source" TEXT NOT NULL DEFAULT 'template',
    "comment" TEXT,
    "createdById" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'DEMANDE',
    "comment" TEXT,
    "attachmentPath" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL DEFAULT 'CORRECTION_ADMIN',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyValidation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "MonthlyValidationStatus" NOT NULL DEFAULT 'EN_PREPARATION',
    "employeeValidatedAt" TIMESTAMP(3),
    "employeeComment" TEXT,
    "rhValidatedAt" TIMESTAMP(3),
    "rhComment" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "month" INTEGER,
    "year" INTEGER,
    "filePath" TEXT NOT NULL,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClockEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "ClockAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'qr',
    "editedById" TEXT,
    "editReason" TEXT,
    "originalTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CabinetSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Cabinet Faraday',
    "address" TEXT,
    "logoPath" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "openingHours" TEXT,
    "roundingPolicy" TEXT NOT NULL DEFAULT 'EXACT',
    "allowFutureEdits" BOOLEAN NOT NULL DEFAULT true,
    "allowLeaveRequests" BOOLEAN NOT NULL DEFAULT true,
    "smtpConfigJson" TEXT,
    "rulesConfigJson" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "CabinetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionKey_key" ON "UserPermission"("userId", "permissionKey");

-- CreateIndex
CREATE UNIQUE INDEX "PractitionerProfile_userId_key" ON "PractitionerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantProfile_userId_key" ON "AssistantProfile"("userId");

-- CreateIndex
CREATE INDEX "AssistantPractitionerAssignment_assistantId_idx" ON "AssistantPractitionerAssignment"("assistantId");

-- CreateIndex
CREATE INDEX "AssistantPractitionerAssignment_practitionerId_idx" ON "AssistantPractitionerAssignment"("practitionerId");

-- CreateIndex
CREATE INDEX "ScheduleTemplate_userId_dayOfWeek_idx" ON "ScheduleTemplate"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "WorkEntry_date_idx" ON "WorkEntry"("date");

-- CreateIndex
CREATE INDEX "WorkEntry_status_idx" ON "WorkEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkEntry_userId_date_key" ON "WorkEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "Absence_userId_idx" ON "Absence"("userId");

-- CreateIndex
CREATE INDEX "Absence_status_idx" ON "Absence"("status");

-- CreateIndex
CREATE INDEX "Adjustment_userId_date_idx" ON "Adjustment"("userId", "date");

-- CreateIndex
CREATE INDEX "MonthlyValidation_year_month_idx" ON "MonthlyValidation"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyValidation_userId_month_year_key" ON "MonthlyValidation"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ClockEntry_userId_idx" ON "ClockEntry"("userId");

-- CreateIndex
CREATE INDEX "ClockEntry_timestamp_idx" ON "ClockEntry"("timestamp");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PractitionerProfile" ADD CONSTRAINT "PractitionerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantProfile" ADD CONSTRAINT "AssistantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantPractitionerAssignment" ADD CONSTRAINT "AssistantPractitionerAssignment_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantPractitionerAssignment" ADD CONSTRAINT "AssistantPractitionerAssignment_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntry" ADD CONSTRAINT "WorkEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntry" ADD CONSTRAINT "WorkEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntry" ADD CONSTRAINT "WorkEntry_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyValidation" ADD CONSTRAINT "MonthlyValidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClockEntry" ADD CONSTRAINT "ClockEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClockEntry" ADD CONSTRAINT "ClockEntry_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

