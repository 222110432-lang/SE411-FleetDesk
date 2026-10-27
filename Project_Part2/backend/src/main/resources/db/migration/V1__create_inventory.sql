CREATE TABLE computers (
    id UUID PRIMARY KEY,
    tag VARCHAR(24) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL,
    serial VARCHAR(64) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    department VARCHAR(20) NOT NULL,
    assigned_to VARCHAR(80) NOT NULL,
    location VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    cost DECIMAL(12,2) NOT NULL CHECK (cost >= 0 AND cost <= 1000000),
    notes VARCHAR(500) NOT NULL
);
CREATE INDEX computers_status_idx ON computers(status);
CREATE INDEX computers_department_idx ON computers(department);
CREATE TABLE app_settings (
    setting_key VARCHAR(80) PRIMARY KEY,
    setting_value VARCHAR(80) NOT NULL
);
