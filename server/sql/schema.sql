CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'teacher', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solve_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  library_type ENUM('original', 'strategy') NOT NULL DEFAULT 'original',
  title VARCHAR(255) NOT NULL,
  problem_text MEDIUMTEXT NOT NULL,
  recognized_text MEDIUMTEXT NULL,
  grade_level VARCHAR(64) NULL,
  subject VARCHAR(64) NULL,
  topic VARCHAR(128) NULL,
  knowledge_points JSON NULL,
  analysis MEDIUMTEXT NULL,
  steps JSON NULL,
  final_answer MEDIUMTEXT NULL,
  common_mistakes JSON NULL,
  verification MEDIUMTEXT NULL,
  visualization_spec JSON NULL,
  quality_check JSON NULL,
  source_code MEDIUMTEXT NULL,
  province VARCHAR(64) NULL,
  city VARCHAR(64) NULL,
  question_type VARCHAR(64) NULL,
  year VARCHAR(16) NULL,
  school VARCHAR(128) NULL,
  is_favorite TINYINT(1) NOT NULL DEFAULT 0,
  publish_status ENUM('draft', 'published', 'private') NOT NULL DEFAULT 'draft',
  points INT NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_solve_records_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  KEY idx_records_user_library_created (user_id, library_type, created_at),
  KEY idx_records_user_favorite (user_id, is_favorite),
  KEY idx_records_publish_status (publish_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  solve_record_id BIGINT UNSIGNED NULL,
  file_type ENUM('image', 'pdf') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  oss_bucket VARCHAR(128) NULL,
  oss_key VARCHAR(512) NULL,
  sha256 CHAR(64) NULL,
  width INT NULL,
  height INT NULL,
  status ENUM('uploaded', 'used', 'deleted') NOT NULL DEFAULT 'uploaded',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_attachments_record
    FOREIGN KEY (solve_record_id) REFERENCES solve_records(id)
    ON DELETE SET NULL,
  KEY idx_attachments_user_created (user_id, created_at),
  KEY idx_attachments_record (solve_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS model_calls (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  solve_record_id BIGINT UNSIGNED NULL,
  stage ENUM('recognition', 'solve', 'verify') NOT NULL,
  provider VARCHAR(32) NOT NULL,
  model_name VARCHAR(128) NOT NULL,
  request_id VARCHAR(128) NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  fallback_from VARCHAR(128) NULL,
  prompt_tokens INT NULL,
  completion_tokens INT NULL,
  total_tokens INT NULL,
  latency_ms INT NULL,
  error_code VARCHAR(64) NULL,
  error_message VARCHAR(512) NULL,
  response_schema_version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_model_calls_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_model_calls_record
    FOREIGN KEY (solve_record_id) REFERENCES solve_records(id)
    ON DELETE SET NULL,
  KEY idx_model_calls_user_date (user_id, created_at),
  KEY idx_model_calls_record_stage (solve_record_id, stage),
  KEY idx_model_calls_provider_model (provider, model_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
