DROP TABLE IF EXISTS personal_info;
CREATE TABLE personal_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    amount VARCHAR(255)
  );