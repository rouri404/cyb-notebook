import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

export const MOCK_MODE = process.env.USE_MOCK_DB !== 'false';

const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.COSMOS_DATABASE || "CadernoDB";
const containerId = process.env.COSMOS_CONTAINER || "Notebooks";

export async function getContainer() {
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  const { container } = await database.containers.createIfNotExists({ id: containerId });
  return container;
}

export const mockDatabase: Record<string, any> = {
  "notebook-default": {
    id: "notebook-default",
    name: "Página 1",
    updatedAt: new Date().toISOString(),
    style: {
      paperType: "lined", // lined, grid, dotted, blank
      textColor: "#1a1a1a",
      font: "handwriting-caveat"
    },
    items: []
  }
};
