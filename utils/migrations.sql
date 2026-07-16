-- Banco de Dados: notebook_db

CREATE TABLE IF NOT EXISTS notebooks (
  id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

-- Inserindo página inicial de exemplo (opcional)
INSERT IGNORE INTO notebooks (id, data) VALUES (
  'notebook-default',
  '{
    "id": "notebook-default",
    "name": "Página 1",
    "updatedAt": "2026-07-15T00:00:00.000Z",
    "style": {
      "paperType": "lined",
      "textColor": "#1a1a1a",
      "font": "handwriting-caveat"
    },
    "items": []
  }'
);
