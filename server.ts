import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/db.ts';
import factusManager from './server/factus.ts';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper function for dynamic INSERT queries matching bc-v1
function generateStrOfDict(dict: Record<string, any>, keyValue = true, restrict?: string): string {
  if (!dict) return '';
  let str = '';
  for (const key in dict) {
    if (key === restrict) continue;
    let val = dict[key];
    if (val === null || val === undefined) {
      val = 'NULL';
    } else if (typeof val === 'string') {
      val = `'${val.replace(/'/g, "''")}'`;
    }
    str += keyValue ? `${key} = ${val},` : `${val},`;
  }
  return str.replace(/,$/, '');
}

function getKeysDict(dict: Record<string, any>, restrict?: string): string[] {
  if (!dict) return [];
  const keys: string[] = [];
  for (const key in dict) {
    if (key === restrict) continue;
    keys.push(key);
  }
  return keys;
}

// ==========================================
// 1. FACTUS CHALLENGE CORE BACKEND ENDPOINTS
// ==========================================

// Welcome endpoint (GET / and GET /api/)
const welcomeHandler = (_req: Request, res: Response) => {
  res.json({
    message: 'Bienvenido al API del reto FACTUS, de "Halltec", por SRM-TRG',
    status: 200,
    server: 'Node.js Express + PostgreSQL + Factus OAuth 2.0',
    timestamp: new Date().toISOString(),
  });
};
app.get('/', (req, res, next) => {
  // If client accepts HTML and not explicitly an API call, let Vite handle it
  if (req.headers.accept?.includes('text/html')) {
    return next();
  }
  welcomeHandler(req, res);
});
app.get('/api', welcomeHandler);
app.get('/api/', welcomeHandler);

// GET /get-data/:table
const getDataHandler = async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    // Basic table sanitization
    const validTables = ['customer', 'products', 'municipality', 'identification_document', 'customer_tribute', 'legal_organization', 'payment_method', 'invoices'];
    if (!validTables.includes(table.toLowerCase())) {
      return res.status(400).json({ status: 400, message: `Tabla ${table} no permitida o desconocida` });
    }

    const { rows, rowCount } = await db.query(`SELECT * FROM ${table}`);
    if (rowCount === 0) {
      return res.status(404).json({ status: 404, message: 'No se encontraron datos', data: [] });
    }
    res.json({ status: 200, message: 'Datos encontrados', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 500, message: 'Error al obtener los datos', error: err.message });
  }
};
app.get('/get-data/:table', getDataHandler);
app.get('/api/get-data/:table', getDataHandler);

// POST /get-join (Used by Factus frontend for specific queries like SELECT * FROM products WHERE ...)
const getJoinHandler = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ status: 400, message: 'Consulta SQL no proporcionada' });
    }

    const { rows, rowCount } = await db.query(query);
    if (rowCount === 0) {
      return res.status(404).json({ status: 404, message: 'No se encontraron datos', data: [] });
    }
    res.json({ status: 200, message: 'Datos encontrados', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 500, message: 'Error al obtener los datos', error: err.message });
  }
};
app.post('/get-join', getJoinHandler);
app.post('/get-join/', getJoinHandler);
app.post('/api/get-join', getJoinHandler);

// POST /add-data/:table
const addDataHandler = async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const data = req.body;
    const strQuery = generateStrOfDict(data, false);
    const cols = getKeysDict(data).join(', ');

    const { rows, rowCount } = await db.query(`INSERT INTO ${table}(${cols}) VALUES (${strQuery}) RETURNING *`);
    if (rowCount === 0) {
      return res.status(404).json({ status: 404, message: 'No se agregaron los datos' });
    }
    res.json({ status: 200, message: 'Datos agregados', data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ status: 500, message: 'Error al agregar los datos', error: err.message });
  }
};
app.post('/add-data/:table', addDataHandler);
app.post('/api/add-data/:table', addDataHandler);

// PUT / PATCH /update-data/:table/:property/:value
const updateDataHandler = async (req: Request, res: Response) => {
  try {
    const { table, property, value } = req.params;
    const data = req.body;
    const strQuery = generateStrOfDict(data, true);

    const { rows, rowCount } = await db.query(`UPDATE ${table} SET ${strQuery} WHERE ${property} = '${value}' RETURNING *`);
    if (rowCount === 0) {
      return res.status(404).json({ status: 404, message: 'No se actualizaron los datos' });
    }
    res.json({ status: 200, message: 'Datos actualizados', updated_fields: rows[0] });
  } catch (err: any) {
    res.status(500).json({ status: 500, message: 'Error al actualizar los datos', error: err.message });
  }
};
app.put('/update-data/:table/:property/:value', updateDataHandler);
app.patch('/update-data/:table/:property/:value', updateDataHandler);
app.put('/api/update-data/:table/:property/:value', updateDataHandler);
app.patch('/api/update-data/:table/:property/:value', updateDataHandler);

// DELETE /delete/:table/:property/:value
const deleteDataHandler = async (req: Request, res: Response) => {
  try {
    const { table, property, value } = req.params;
    const { rows, rowCount } = await db.query(`DELETE FROM ${table} WHERE ${property} = '${value}' RETURNING *`);
    if (rowCount === 0) {
      return res.status(404).json({ status: 404, message: 'No se eliminaron los datos' });
    }
    res.json({ status: 200, message: 'Datos eliminados', deleted: rows[0] });
  } catch (err: any) {
    res.status(500).json({ status: 500, message: 'Error al eliminar los datos', error: err.message });
  }
};
app.delete('/delete/:table/:property/:value', deleteDataHandler);
app.delete('/api/delete/:table/:property/:value', deleteDataHandler);

// ==========================================
// 2. FACTUS INVOICES ENDPOINTS
// ==========================================

// GET /factura (list all invoices)
const getAllFactHandler = async (_req: Request, res: Response) => {
  const result = await factusManager.getAllFacturas();
  res.status(result.status).json(result);
};
app.get('/factura', getAllFactHandler);
app.get('/api/factura', getAllFactHandler);

// POST /factura (create & validate electronic bill)
const addFactHandler = async (req: Request, res: Response) => {
  const result = await factusManager.addFactura(req.body);
  res.status(result.status).json(result);
};
app.post('/factura', addFactHandler);
app.post('/api/factura', addFactHandler);

// GET /factura/:number (view single invoice details)
const getOneFactHandler = async (req: Request, res: Response) => {
  const result = await factusManager.getOneFactura(req.params.number);
  res.status(result.status).json(result);
};
app.get('/factura/:number', getOneFactHandler);
app.get('/api/factura/:number', getOneFactHandler);

// GET /factura-download/:number (base64 PDF download)
const getPdfFactHandler = async (req: Request, res: Response) => {
  const result = await factusManager.getPdf64(req.params.number);
  res.status(result.status).json(result);
};
app.get('/factura-download/:number', getPdfFactHandler);
app.get('/api/factura-download/:number', getPdfFactHandler);

// DELETE /factura/:reference_code (delete invoice)
const deleteFactHandler = async (req: Request, res: Response) => {
  const result = await factusManager.deleteFactura(req.params.reference_code);
  res.status(result.status).json(result);
};
app.delete('/factura/:reference_code', deleteFactHandler);
app.delete('/api/factura/:reference_code', deleteFactHandler);

// ==========================================
// 3. SYSTEM & MANAGEMENT ENDPOINTS (FOR UI)
// ==========================================

// Get system health, database status, and Factus OAuth status
app.get('/api/system/status', async (_req: Request, res: Response) => {
  try {
    const dbStatus = await db.getStatus();
    const factusConfig = factusManager.getConfig();
    const tokenState = factusManager.getTokenState();

    res.json({
      status: 200,
      database: dbStatus,
      factus: {
        config: factusConfig,
        token: tokenState,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 500, error: err.message });
  }
});

// Configure or test PostgreSQL connection (Supabase / Neon / Render)
app.post('/api/system/db-config', async (req: Request, res: Response) => {
  const { connectionString, host, user, password, database, port: dbPort, ssl } = req.body;
  const result = await db.connectPostgres({
    connectionString,
    host,
    user,
    password,
    database,
    port: dbPort ? parseInt(dbPort, 10) : 5432,
    ssl,
  });
  const status = await db.getStatus();
  res.json({ ...result, currentStatus: status });
});

// Configure Factus API credentials & toggle simulator mode
app.post('/api/system/factus-config', async (req: Request, res: Response) => {
  factusManager.updateConfig(req.body);
  const refreshed = await factusManager.refreshToken();
  res.json({
    status: 200,
    success: refreshed,
    token: factusManager.getTokenState(),
    config: factusManager.getConfig(),
  });
});

// Refresh Factus token manually
app.post('/api/system/refresh-token', async (_req: Request, res: Response) => {
  const refreshed = await factusManager.refreshToken();
  res.json({
    status: 200,
    success: refreshed,
    token: factusManager.getTokenState(),
  });
});

// Get raw schema.sql for Supabase / Neon / Render
app.get('/api/system/schema.sql', (_req: Request, res: Response) => {
  const sql = db.getSchemaSql();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="schema.sql"');
  res.send(sql);
});

// Reset seeds
app.post('/api/system/reset-db', async (_req: Request, res: Response) => {
  const result = await db.resetSeeds();
  res.json(result);
});

// Execute arbitrary SQL (for testing tables in UI)
app.post('/api/system/execute-sql', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql) {
      return res.status(400).json({ error: 'SQL vacío' });
    }
    const result = await db.query(sql);
    res.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. STATIC ASSETS & VITE INTEGRATION
// ==========================================

// Serve static resources from public folder (CSS, images, utils, json, pages)
app.use(express.static(path.resolve(__dirname, 'public')));

// Mount Vite in development mode
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Factus Challenge Server running on http://0.0.0.0:${port}`);
  console.log(`📊 API endpoints available at http://localhost:${port}/api/`);
});
