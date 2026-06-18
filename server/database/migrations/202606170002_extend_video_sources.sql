SET @schema_name := DATABASE();

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE videos ADD COLUMN source_type VARCHAR(20) NOT NULL DEFAULT ''local'' AFTER speaker_names',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'source_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE videos ADD COLUMN embed_url VARCHAR(800) DEFAULT NULL AFTER video_url',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'embed_url'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE videos ADD COLUMN provider VARCHAR(40) DEFAULT NULL AFTER embed_url',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'provider'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX idx_videos_source_type ON videos (source_type)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'videos' AND INDEX_NAME = 'idx_videos_source_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE videos
SET source_type = 'local'
WHERE source_type IS NULL OR source_type = '';

UPDATE videos
SET source_type = 'embed'
WHERE embed_url IS NOT NULL AND embed_url <> '';

UPDATE videos
SET source_type = 'direct'
WHERE source_type = 'local' AND video_url LIKE 'http%';
