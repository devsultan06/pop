import snowflake from "snowflake-sdk";

// Define a type for query parameters
type QueryParam = string | number | boolean | null | undefined | Date;

// In-memory fallback database for hackathon guest mode/missing Snowflake credentials
interface MockDb {
  sessions: any[];
  milestones: any[];
}

const mockDb: MockDb = {
  sessions: [
    {
      ID: "mock-1",
      WALLET_ADDRESS: "demo-wallet",
      TIMESTAMP: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      TYPE: "voice",
      TITLE: "Violin scales practice",
      CONTENT: "Focused on G major third octave. Tuning felt a bit off in the higher notes, but speed is improving.",
      FEEDBACK_TEXT: "Correcting scale intonation in the third octave is always challenging. Focus on finger placement micro-adjustments.",
      SENTIMENT: "improving",
      DURATION: 94
    },
    {
      ID: "mock-2",
      WALLET_ADDRESS: "demo-wallet",
      TIMESTAMP: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      TYPE: "text",
      TITLE: "Dvořák cello concerto intro",
      CONTENT: "Practiced the opening bars. Sticking to the metronome at 72 bpm. Fingering feels solid, shifting needs work.",
      FEEDBACK_TEXT: "Keeping Dvořák at a steady 72 bpm is excellent discipline. Try adding dynamic contrasts gradually now that fingering is locked.",
      SENTIMENT: "steady",
      DURATION: 120
    }
  ],
  milestones: []
};

// Check if credentials exist
const hasCredentials = !!(
  process.env.SNOWFLAKE_ACCOUNT &&
  process.env.SNOWFLAKE_USERNAME &&
  process.env.SNOWFLAKE_PASSWORD
);

let pool: any = null;
let isInitialized = false;
let isInitializing = false;

if (hasCredentials) {
  try {
    // Create a connection pool if credentials are valid
    pool = snowflake.createPool(
      {
        account: process.env.SNOWFLAKE_ACCOUNT!,
        username: process.env.SNOWFLAKE_USERNAME!,
        password: process.env.SNOWFLAKE_PASSWORD!,
        database: process.env.SNOWFLAKE_DATABASE || "PROOF_OF_PRACTICE",
        schema: process.env.SNOWFLAKE_SCHEMA || "PUBLIC",
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
        role: process.env.SNOWFLAKE_ROLE,
      },
      {
        max: 5,
        min: 1,
      }
    );
    console.log("Snowflake connection pool initialized.");
  } catch (error) {
    console.error("Failed to initialize Snowflake connection pool, using mock db fallback:", error);
  }
} else {
  console.log("No Snowflake credentials found. proof-of-practice is running in MOCK FALLBACK mode.");
}

/**
 * Run a parameterized SQL query
 */
export async function querySnowflake(sqlText: string, binds: QueryParam[] = []): Promise<any[]> {
  if (!pool) {
    // Graceful fallback for demo
    return handleMockQuery(sqlText, binds);
  }

  // Auto-initialize database and tables on the very first query
  if (!isInitialized && !isInitializing) {
    isInitializing = true;
    try {
      console.log("Auto-initializing Snowflake database and tables...");
      await initializeTables();
      isInitialized = true;
    } catch (e) {
      console.error("Auto table initialization failed:", e);
    } finally {
      isInitializing = false;
    }
  }

  console.log(`Executing SQL: ${sqlText} with binds:`, binds);

  return new Promise((resolve, reject) => {
    pool.use(async (clientConnection: any) => {
      clientConnection.execute({
        sqlText,
        binds,
        complete: (err: any, stmt: any, rows: any) => {
          if (err) {
            console.error(`Snowflake query failed: ${err.message}`);
            reject(err);
          } else {
            resolve(rows);
          }
        },
      });
    });
  });
}

/**
 * Handle mock database logic on missing configuration
 */
function handleMockQuery(sqlText: string, binds: QueryParam[]): any[] {
  const normalized = sqlText.toLowerCase().replace(/\s+/g, " ");

  // Insert session
  if (normalized.includes("insert into sessions")) {
    const [id, wallet, timestamp, type, title, content, feedback, sentiment, duration] = binds;
    const newRow = {
      ID: id || `session-${Date.now()}`,
      WALLET_ADDRESS: wallet,
      TIMESTAMP: timestamp || new Date().toISOString(),
      TYPE: type,
      TITLE: title,
      CONTENT: content,
      FEEDBACK_TEXT: feedback,
      SENTIMENT: sentiment || "steady",
      DURATION: duration || 60
    };
    mockDb.sessions.unshift(newRow);
    return [newRow];
  }

  // Insert milestone
  if (normalized.includes("insert into milestones")) {
    const [id, wallet, type, tx, timestamp] = binds;
    const newRow = {
      ID: id,
      WALLET_ADDRESS: wallet,
      MILESTONE_TYPE: type,
      TX_SIGNATURE: tx,
      TIMESTAMP: timestamp || new Date().toISOString()
    };
    mockDb.milestones.push(newRow);
    return [newRow];
  }

  // Get sessions for wallet (last 5)
  if (normalized.includes("select") && normalized.includes("sessions") && normalized.includes("wallet_address =") && normalized.includes("limit 5")) {
    const wallet = binds[0] as string;
    return mockDb.sessions
      .filter((s) => s.WALLET_ADDRESS === wallet)
      .slice(0, 5);
  }

  // Get all session timestamps for wallet
  if (normalized.includes("select timestamp") && normalized.includes("sessions") && normalized.includes("wallet_address =")) {
    const wallet = binds[0] as string;
    return mockDb.sessions
      .filter((s) => s.WALLET_ADDRESS === wallet)
      .map((s) => ({ TIMESTAMP: s.TIMESTAMP }));
  }

  // General dashboard query (percentile window functions, etc.)
  if (normalized.includes("percent_rank")) {
    // Return percentile mock calculation
    return [{ PERCENTILE: 0.85 }];
  }

  // Default query fallbacks
  if (normalized.includes("sessions")) {
    const wallet = binds[0] as string;
    return mockDb.sessions.filter((s) => s.WALLET_ADDRESS === wallet);
  }

  if (normalized.includes("milestones")) {
    const wallet = binds[0] as string;
    return mockDb.milestones.filter((m) => m.WALLET_ADDRESS === wallet);
  }

  return [];
}

/**
 * Set up initial tables in Snowflake database (run on startup / log endpoints)
 */
export async function initializeTables() {
  if (!pool) return;
  
  try {
    // 1. Create the database
    await querySnowflake("CREATE DATABASE IF NOT EXISTS PROOF_OF_PRACTICE");
    
    // 2. Use the database
    await querySnowflake("USE DATABASE PROOF_OF_PRACTICE");

    // 3. Create SESSIONS table
    await querySnowflake(`
      CREATE TABLE IF NOT EXISTS SESSIONS (
        ID VARCHAR(255) PRIMARY KEY,
        WALLET_ADDRESS VARCHAR(255) NOT NULL,
        TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
        TYPE VARCHAR(50) NOT NULL,
        TITLE VARCHAR(255),
        CONTENT TEXT,
        FEEDBACK_TEXT TEXT,
        SENTIMENT VARCHAR(50),
        DURATION INTEGER
      )
    `);

    // 4. Create MILESTONES table
    await querySnowflake(`
      CREATE TABLE IF NOT EXISTS MILESTONES (
        ID VARCHAR(255) PRIMARY KEY,
        WALLET_ADDRESS VARCHAR(255) NOT NULL,
        MILESTONE_TYPE VARCHAR(100) NOT NULL,
        TX_SIGNATURE VARCHAR(255),
        TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    
    console.log("Snowflake database tables verified/created successfully.");
  } catch (error) {
    console.error("Could not run table initialization query:", error);
    throw error;
  }
}
