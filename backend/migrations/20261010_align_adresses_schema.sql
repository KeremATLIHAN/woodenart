ALTER TABLE adresses
  MODIFY a_tckn CHAR(11) NOT NULL,
  MODIFY a_title VARCHAR(50) NOT NULL,
  MODIFY a_country VARCHAR(100) NOT NULL,
  MODIFY a_state VARCHAR(100) NOT NULL,
  MODIFY a_district VARCHAR(100) NOT NULL,
  MODIFY a_postcode VARCHAR(20) NOT NULL,
  ADD INDEX idx_adresses_u_id (u_id),
  ADD CONSTRAINT fk_adresses_user
    FOREIGN KEY (u_id) REFERENCES users (u_id)
    ON DELETE CASCADE;
