ALTER TABLE users
  MODIFY role ENUM('owner','admin','editor','teacher','user') NOT NULL DEFAULT 'user';
