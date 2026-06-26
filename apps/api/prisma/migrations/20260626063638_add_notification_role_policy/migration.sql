-- CreateTable
CREATE TABLE "notification_role_policies" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_role_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_role_policies_roleId_type_key" ON "notification_role_policies"("roleId", "type");

-- AddForeignKey
ALTER TABLE "notification_role_policies" ADD CONSTRAINT "notification_role_policies_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
