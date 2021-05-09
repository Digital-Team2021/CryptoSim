DROP TABLE IF EXISTS personal_info;
CREATE TABLE personal_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255)
  );

DROP TABLE IF EXISTS coins_info;
CREATE TABLE coins_info (
    name VARCHAR(255),
    coinName VARCHAR(255),
    amount VARCHAR(255)

  );