-- CreateTable
CREATE TABLE `tutor_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `course_slug` VARCHAR(64) NOT NULL,
    `lesson_slug` VARCHAR(128) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `status` VARCHAR(16) NOT NULL,
    `model` VARCHAR(64) NULL,
    `input_tokens` INTEGER NOT NULL DEFAULT 0,
    `cache_read_tokens` INTEGER NOT NULL DEFAULT 0,
    `cache_write_tokens` INTEGER NOT NULL DEFAULT 0,
    `output_tokens` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tutor_messages_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tutor_messages` ADD CONSTRAINT `tutor_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

