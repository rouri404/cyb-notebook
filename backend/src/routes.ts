import { Router, Request, Response } from 'express';
import { pool } from './db';

const router = Router();

// Helpers
async function getAllNotebooks() {
  const [rows]: any = await pool.query('SELECT data FROM notebooks');
  // Em alguns drivers MySQL o JSON já vem parseado, em outros não. Vamos garantir.
  return rows.map((r: any) => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
}

async function getNotebook(id: string) {
  const [rows]: any = await pool.query('SELECT data FROM notebooks WHERE id = ?', [id]);
  if (rows.length === 0) return undefined;
  return typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
}

async function updateNotebook(notebook: any) {
  notebook.updatedAt = new Date().toISOString();
  await pool.query(
    'INSERT INTO notebooks (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
    [notebook.id, JSON.stringify(notebook)]
  );
  return notebook;
}

// ----------------------------------------------------

router.get('/notebooks', async (req: Request, res: Response) => {
  try {
    const notebooks = await getAllNotebooks();
    res.json(notebooks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/notebooks', async (req: Request, res: Response) => {
  try {
    const newId = `notebook-${Date.now()}`;
    const newNotebook = {
      id: newId,
      name: req.body.name || `Página Nova`,
      updatedAt: new Date().toISOString(),
      style: {
        paperType: "lined",
        textColor: "#1a1a1a",
        font: "handwriting-caveat"
      },
      items: []
    };
    await updateNotebook(newNotebook);
    res.status(201).json(newNotebook);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/notebooks/:id', async (req: Request, res: Response) => {
  try {
    const notebook = await getNotebook(req.params.id as string);
    if (!notebook) return res.status(404).json({ error: "Not found" });
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.patch('/notebooks/:id/style', async (req: Request, res: Response) => {
  try {
    const notebook = await getNotebook(req.params.id as string);
    if (!notebook) return res.status(404).json({ error: "Not found" });
    
    notebook.style = { ...notebook.style, ...req.body };
    const updated = await updateNotebook(notebook);
    res.json(updated.style);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.patch('/notebooks/:id/name', async (req: Request, res: Response) => {
  try {
    const notebook = await getNotebook(req.params.id as string);
    if (!notebook) return res.status(404).json({ error: "Not found" });
    
    notebook.name = req.body.name;
    const updated = await updateNotebook(notebook);
    res.json({ name: updated.name });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/notebooks/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM notebooks WHERE id = ?', [req.params.id as string]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Atualiza itens todos de uma vez (ideal pro estilo Notepad)
router.put('/notebooks/:id/items', async (req: Request, res: Response) => {
  try {
    const notebook = await getNotebook(req.params.id as string);
    if (!notebook) return res.status(404).json({ error: "Not found" });

    notebook.items = req.body.items || [];
    await updateNotebook(notebook);
    res.status(200).json(notebook.items);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.patch('/notebooks/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const notebook = await getNotebook(req.params.id as string);
    if (!notebook) return res.status(404).json({ error: "Not found" });

    const itemIndex = notebook.items.findIndex((i: any) => i.id === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ error: "Item not found" });

    notebook.items[itemIndex] = { ...notebook.items[itemIndex], ...req.body };
    await updateNotebook(notebook);
    res.json(notebook.items[itemIndex]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
