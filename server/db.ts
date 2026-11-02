import pg from 'pg';
import { newDb } from 'pg-mem';
import {
  CUSTOMER_TRIBUTES,
  IDENTIFICATION_DOCUMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  LEGAL_ORGANIZATIONS,
  loadMunicipalities,
  loadInitialInvoices,
  PAYMENT_METHODS,
} from './seeds.ts';

export interface DbConfig {
  connectionString?: string;
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
  ssl?: boolean;
}

export interface DbQueryResult {
  rows: any[];
  rowCount: number;
}

class DatabaseManager {
  private pgPool: pg.Pool | null = null;
  private memDb: any = null;
  private isExternal = false;
  private currentConfig: DbConfig = {};
  private activeConnectionString = '';
  private lastError: string | null = null;

  constructor() {
    this.initFromEnv();
  }

  public initFromEnv() {
    const env = process.env;
    const connStr = env.DATABASE_URL || env.POSTGRES_URL || env.PG_URI;
    if (connStr && connStr.trim().length > 0 && !connStr.includes('MY_APP_URL')) {
      this.connectPostgres({ connectionString: connStr.trim() });
    } else if (env.DB_HOST && env.DB_USER && env.DB_NAME) {
      this.connectPostgres({
        host: env.DB_HOST,
        user: env.DB_USER,
        database: env.DB_NAME,
        password: env.DB_PASSWORD,
        port: env.DB_PORT ? parseInt(env.DB_PORT) : 5432,
        ssl: env.DB_SSL === 'true' || env.DB_SSL === '1',
      });
    } else {
      this.initInMemory();
    }
  }

  public initInMemory() {
    try {
      this.memDb = newDb();
      this.isExternal = false;
      this.lastError = null;
      this.createTablesAndSeeds(this.memDb.adapters.createPg().Pool);
      console.log('✅ In-memory PostgreSQL instance initialized and seeded successfully.');
    } catch (err: any) {
      console.error('Failed to init in-memory database:', err);
      this.lastError = err.message;
    }
  }

  public async connectPostgres(config: DbConfig): Promise<{ success: boolean; message: string }> {
    try {
      const poolConfig: pg.PoolConfig = config.connectionString
        ? {
            connectionString: config.connectionString,
            ssl: config.connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
          }
        : {
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            port: config.port || 5432,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
          };

      const testPool = new pg.Pool(poolConfig);
      // Test query
      const client = await testPool.connect();
      await client.query('SELECT 1 as test');
      client.release();

      // If successful, close existing pool if any
      if (this.pgPool) {
        await this.pgPool.end().catch(() => {});
      }

      this.pgPool = testPool;
      this.isExternal = true;
      this.currentConfig = config;
      this.activeConnectionString = config.connectionString || `postgresql://${config.user}:***@${config.host}:${config.port || 5432}/${config.database}`;
      this.lastError = null;

      // Auto-migrate tables if not present
      await this.ensureTablesExistOnPool(this.pgPool);

      return { success: true, message: 'Conectado exitosamente a PostgreSQL en la nube' };
    } catch (err: any) {
      console.warn('PostgreSQL connection attempt failed:', err.message);
      this.lastError = err.message;
      if (!this.memDb) {
        this.initInMemory();
      }
      return { success: false, message: `Error conectando a PostgreSQL: ${err.message}` };
    }
  }

  public async query(sqlText: string, params?: any[]): Promise<DbQueryResult> {
    if (this.isExternal && this.pgPool) {
      try {
        const res = await this.pgPool.query(sqlText, params);
        return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
      } catch (err: any) {
        console.error('PostgreSQL query error, falling back to in-memory:', err.message);
        if (this.memDb) {
          const memPool = this.memDb.adapters.createPg().Pool;
          const res = await new memPool().query(sqlText, params);
          return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
        }
        throw err;
      }
    } else {
      if (!this.memDb) {
        this.initInMemory();
      }
      const memPool = this.memDb.adapters.createPg().Pool;
      const res = await new memPool().query(sqlText, params);
      return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
    }
  }

  private async ensureTablesExistOnPool(pool: pg.Pool) {
    try {
      const client = await pool.connect();
      try {
        const schema = this.getSchemaSql();
        await client.query(schema);
        console.log('✅ PostgreSQL tables and seeds verified on cloud database.');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error verifying/creating tables on external PostgreSQL:', err);
    }
  }

  private async createTablesAndSeeds(poolConstructor: any) {
    const pool = new poolConstructor();
    const schema = this.getSchemaSql();
    await pool.query(schema);
  }

  public getSchemaSql(): string {
    const municipalities = loadMunicipalities();

    let sql = `
-- ============================================================
-- RETO FACTUS - BASE DE DATOS POSTGRESQL (SUPABASE / NEON / RENDER)
-- ============================================================

CREATE TABLE IF NOT EXISTS identification_document (
    id INT PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_tribute (
    id INT PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS legal_organization (
    id INT PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_method (
    id INT PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS municipality (
    id INT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS products (
    code_reference VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(14,2) NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    discount_rate NUMERIC(6,2) DEFAULT 0,
    tax_rate VARCHAR(20) DEFAULT '19.00',
    unit_measure_id INT DEFAULT 70,
    standard_code_id INT DEFAULT 1,
    is_excluded INT DEFAULT 0,
    tribute_id INT DEFAULT 1,
    withholding_taxes TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS customer (
    id VARCHAR(50) PRIMARY KEY,
    names VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    type_id INT,
    company VARCHAR(255),
    address VARCHAR(255),
    phone VARCHAR(50),
    trade_name VARCHAR(255),
    municipality_id INT,
    verification_digit VARCHAR(10),
    id_org INT,
    tribute_id INT
);

CREATE TABLE IF NOT EXISTS invoices (
    reference_code VARCHAR(50) PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    status INT DEFAULT 1,
    total NUMERIC(14,2) DEFAULT 0,
    customer_identification VARCHAR(50),
    customer_name VARCHAR(255),
    created_at VARCHAR(50),
    bill_data TEXT,
    pdf_base_64 TEXT
);

-- SEED DATA
`;

    // Identification documents
    IDENTIFICATION_DOCUMENTS.forEach((item) => {
      sql += `INSERT INTO identification_document (id, code, name) VALUES (${item.id}, '${item.code}', '${item.name.replace(/'/g, "''")}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    // Customer tributes
    CUSTOMER_TRIBUTES.forEach((item) => {
      sql += `INSERT INTO customer_tribute (id, code, name) VALUES (${item.id}, '${item.code}', '${item.name.replace(/'/g, "''")}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    // Legal organizations
    LEGAL_ORGANIZATIONS.forEach((item) => {
      sql += `INSERT INTO legal_organization (id, code, name) VALUES (${item.id}, '${item.code}', '${item.name.replace(/'/g, "''")}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    // Payment methods
    PAYMENT_METHODS.forEach((item) => {
      sql += `INSERT INTO payment_method (id, code, name) VALUES (${item.id}, '${item.code}', '${item.name.replace(/'/g, "''")}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    // Municipalities (essential ones first + batch rest)
    municipalities.slice(0, 300).forEach((item) => {
      sql += `INSERT INTO municipality (id, code, name, department) VALUES (${item.id}, '${item.code}', '${item.name.replace(/'/g, "''")}', '${(item.department || '').replace(/'/g, "''")}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    // Products
    INITIAL_PRODUCTS.forEach((p) => {
      sql += `INSERT INTO products (code_reference, name, price, quantity, discount_rate, tax_rate, unit_measure_id, standard_code_id, is_excluded, tribute_id, withholding_taxes) VALUES ('${p.code_reference}', '${p.name.replace(/'/g, "''")}', ${p.price}, ${p.quantity}, ${p.discount_rate}, '${p.tax_rate}', ${p.unit_measure_id}, ${p.standard_code_id}, ${p.is_excluded}, ${p.tribute_id}, '${p.withholding_taxes.replace(/'/g, "''")}') ON CONFLICT (code_reference) DO NOTHING;\n`;
    });

    // Customers
    INITIAL_CUSTOMERS.forEach((c) => {
      const dv = c.verification_digit ? `'${c.verification_digit}'` : 'NULL';
      sql += `INSERT INTO customer (id, names, email, type_id, company, address, phone, trade_name, municipality_id, verification_digit, id_org, tribute_id) VALUES ('${c.id}', '${c.names.replace(/'/g, "''")}', '${c.email.replace(/'/g, "''")}', ${c.type_id}, '${(c.company || '').replace(/'/g, "''")}', '${(c.address || '').replace(/'/g, "''")}', '${(c.phone || '').replace(/'/g, "''")}', '${(c.trade_name || '').replace(/'/g, "''")}', ${c.municipality_id}, ${dv}, ${c.id_org}, ${c.tribute_id}) ON CONFLICT (id) DO NOTHING;\n`;
    });

    // Invoices
    const initialInvoices = loadInitialInvoices();
    initialInvoices.forEach((inv) => {
      const ref = inv.reference_code || 'REF_' + inv.id;
      const num = inv.number || `SETP${inv.id}`;
      const total = parseFloat(inv.total || '0') || 0;
      const custId = inv.identification || '';
      const custName = (inv.graphic_representation_name || inv.names || '').replace(/'/g, "''");
      const created = inv.created_at || '';
      const billData = JSON.stringify(inv).replace(/'/g, "''");
      sql += `INSERT INTO invoices (reference_code, number, status, total, customer_identification, customer_name, created_at, bill_data) VALUES ('${ref}', '${num}', ${inv.status || 1}, ${total}, '${custId}', '${custName}', '${created}', '${billData}') ON CONFLICT (reference_code) DO NOTHING;\n`;
    });

    return sql;
  }

  public async getStatus() {
    let counts: Record<string, number> = {};
    const tables = ['customer', 'products', 'municipality', 'payment_method', 'identification_document', 'customer_tribute', 'legal_organization', 'invoices'];
    for (const tbl of tables) {
      try {
        const res = await this.query(`SELECT COUNT(*) as cnt FROM ${tbl}`);
        counts[tbl] = parseInt(res.rows[0]?.cnt || res.rows[0]?.count || 0);
      } catch {
        counts[tbl] = 0;
      }
    }

    return {
      mode: this.isExternal ? 'postgres-cloud' : 'postgres-in-memory',
      connected: true,
      isExternal: this.isExternal,
      connectionInfo: this.isExternal ? this.activeConnectionString : 'Local In-Memory PostgreSQL (pg-mem)',
      host: this.currentConfig.host || (this.currentConfig.connectionString ? this.currentConfig.connectionString.split('@')[1]?.split('/')[0] : 'In-Memory'),
      database: this.currentConfig.database || 'factus_db',
      lastError: this.lastError,
      tableCounts: counts,
    };
  }

  public async resetSeeds() {
    this.initInMemory();
    return { success: true, message: 'Base de datos reiniciada con datos semilla del Reto Factus' };
  }
}

export const dbManager = new DatabaseManager();
export default dbManager;
