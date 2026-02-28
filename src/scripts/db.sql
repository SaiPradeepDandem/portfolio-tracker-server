CREATE TABLE position (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY key,
    ticker VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    buy_price NUMERIC(10,2) NOT NULL,
    current_price NUMERIC(10,2) NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    currency CHAR(3) NOT NULL
);

INSERT INTO position (
    ticker,
    quantity,
    buy_price,
    current_price,
    exchange,
    currency
) VALUES
    ('WDS', 20, 26.01, 24.36, 'ASX',  'AUD'),
    ('TLS', 200, 1.04,  1.56,  'ASX',  'AUD'),
    ('VGA', 10, 226.55, 226.90,'ASX',  'AUD'),
    ('NVO', 44, 85.01,  80.25, 'NYSE', 'USD');
