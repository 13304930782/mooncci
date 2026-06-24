SET @schema_name := DATABASE();

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE videos ADD COLUMN public_scoring_enabled TINYINT NOT NULL DEFAULT 0 AFTER cover_image',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'public_scoring_enabled'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE videos ADD COLUMN class_code VARCHAR(40) NOT NULL DEFAULT '''' AFTER team_name',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'class_code'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN scorer_name VARCHAR(100) NULL AFTER user_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'scorer_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN scorer_class_code VARCHAR(40) NULL AFTER scorer_name',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'scorer_class_code'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN scorer_group_name VARCHAR(100) NULL AFTER scorer_class_code',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'scorer_group_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN scorer_ip VARCHAR(64) NULL AFTER scorer_group_name',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'scorer_ip'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN scorer_user_agent VARCHAR(255) NULL AFTER scorer_ip',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'scorer_user_agent'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN presentation_appearance_score TINYINT NULL AFTER comment',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'presentation_appearance_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN presentation_language_score TINYINT NULL AFTER presentation_appearance_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'presentation_language_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN presentation_timing_score TINYINT NULL AFTER presentation_language_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'presentation_timing_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN principle_analysis_score TINYINT NULL AFTER presentation_timing_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'principle_analysis_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN code_analysis_score TINYINT NULL AFTER principle_analysis_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'code_analysis_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN algorithm_design_score TINYINT NULL AFTER code_analysis_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'algorithm_design_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN implementation_score TINYINT NULL AFTER algorithm_design_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'implementation_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN logic_quality_score TINYINT NULL AFTER implementation_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'logic_quality_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN ui_design_score TINYINT NULL AFTER logic_quality_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'ui_design_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN extra_feature_score TINYINT NULL AFTER ui_design_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'extra_feature_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN answer_clarity_score TINYINT NULL AFTER extra_feature_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'answer_clarity_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE video_scores ADD COLUMN knowledge_score TINYINT NULL AFTER answer_clarity_score',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND COLUMN_NAME = 'knowledge_score'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE video_scores MODIFY COLUMN user_id INT(11) DEFAULT NULL;

SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'DROP INDEX uniq_video_scorer_name ON video_scores',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND INDEX_NAME = 'uniq_video_scorer_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE UNIQUE INDEX uniq_video_scorer_class_name ON video_scores (video_id, scorer_class_code, scorer_name)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'video_scores' AND INDEX_NAME = 'uniq_video_scorer_class_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS video_allowed_classes (
  id INT NOT NULL AUTO_INCREMENT,
  video_id INT NOT NULL,
  class_code VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_video_allowed_class (video_id, class_code),
  KEY idx_video_allowed_class (class_code),
  CONSTRAINT fk_video_allowed_classes_video
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS video_admin_logs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  username VARCHAR(100) NULL,
  action VARCHAR(60) NOT NULL,
  class_code VARCHAR(40) NULL,
  detail VARCHAR(255) NULL,
  ip VARCHAR(64) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_video_admin_logs_created_at (created_at),
  KEY idx_video_admin_logs_class_code (class_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
