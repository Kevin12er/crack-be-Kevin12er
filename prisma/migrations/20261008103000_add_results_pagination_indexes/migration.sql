-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "Course_title_idx" ON "Course"("title");

-- CreateIndex
CREATE INDEX "Result_createdAt_idx" ON "Result"("createdAt" DESC);