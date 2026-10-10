ALTER TABLE orders
  ADD COLUMN u_id INT NULL AFTER o_id,
  ADD INDEX idx_orders_u_id (u_id),
  ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (u_id) REFERENCES users (u_id)
    ON DELETE SET NULL;
