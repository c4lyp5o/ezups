-- CreateTable
CREATE TABLE "Uploads" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "size" INTEGER NOT NULL,
    "mimetype" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "dad" VARCHAR(255) NOT NULL,

    CONSTRAINT "Uploads_pkey" PRIMARY KEY ("id")
);
