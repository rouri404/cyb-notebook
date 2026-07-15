import { Router, Request, Response } from 'express';
import { getContainer, MOCK_MODE, mockDatabase } from './db';

const router = Router();

// Helpers
async function getAllNotebooks() {
  if (MOCK_MODE) {
    return Object.values(mockDatabase);
  }
  const container = await getContainer();
  const { resources } = await container.items.readAll().fetchAll();
  return resources;
}

async function getNotebook(id: string) {
  if (MOCK_MODE) {
    return mockDatabase[id];
  }
  const container = await getContainer();
  try {
    const { resource } = await container.item(id, id).read();
    return resource;
  } catch(e) {
    return undefined;
  }
}

async function updateNotebook(notebook: any) {
  notebook.updatedAt = new Date().toISOString();
  if (MOCK_MODE) {
    mockDatabase[notebook.id] = notebook;
    return notebook;
  }
  const container = await getContainer();
  const { resource } = await container.items.upsert(notebook);
  return resource;
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
    if (MOCK_MODE) {
      delete mockDatabase[req.params.id as string];
      return res.status(204).send();
    }
    const container = await getContainer();
    await container.item(req.params.id as string, req.params.id as string).delete();
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
