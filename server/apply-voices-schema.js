const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// MySQL connection configuration
const MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'ziya_voice_agent',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function applyVoicesSchema() {
    let connection;
    try {
        console.log('🔄 Connecting to MySQL database...');

        connection = await mysql.createConnection({
            host: MYSQL_CONFIG.host,
            port: MYSQL_CONFIG.port,
            user: MYSQL_CONFIG.user,
            password: MYSQL_CONFIG.password,
            database: MYSQL_CONFIG.database
        });

        console.log(`✅ Connected to database: ${MYSQL_CONFIG.database}`);

        // Read and execute voices table schema
        console.log('\n📋 Creating voices table...');
        const voicesSchemaPath = path.resolve(__dirname, 'migrations', 'voices-schema.sql');
        const voicesSchemaSql = fs.readFileSync(voicesSchemaPath, 'utf8');

        const voicesStatements = voicesSchemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of voicesStatements) {
            try {
                await connection.execute(statement);
                console.log('  ✓ Executed:', statement.substring(0, 60) + '...');
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('  ℹ️  Table already exists, skipping...');
                } else {
                    console.warn('  ⚠️  Warning:', error.message);
                }
            }
        }

        // Read and execute agents table modifications
        console.log('\n📋 Adding voice provider columns to agents table...');
        const agentsSchemaPath = path.resolve(__dirname, 'migrations', 'add-voice-provider-to-agents.sql');
        const agentsSchemaSql = fs.readFileSync(agentsSchemaPath, 'utf8');

        const agentsStatements = agentsSchemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of agentsStatements) {
            try {
                await connection.execute(statement);
                console.log('  ✓ Executed:', statement.substring(0, 60) + '...');
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('  ℹ️  Column already exists, skipping...');
                } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log('  ℹ️  Index already exists or doesn\'t exist, skipping...');
                } else {
                    console.warn('  ⚠️  Warning:', error.message);
                }
            }
        }

        console.log('\n✅ Voices schema applied successfully!');
        console.log('\n📊 Verifying tables...');

        // Verify voices table
        const [voicesRows] = await connection.execute('SHOW TABLES LIKE "voices"');
        if (voicesRows.length > 0) {
            console.log('  ✓ voices table exists');

            // Show column structure
            const [columns] = await connection.execute('DESCRIBE voices');
            console.log('\n  Voices table structure:');
            columns.forEach(col => {
                console.log(`    - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
        }

        // Verify agents table modifications
        const [agentColumns] = await connection.execute('DESCRIBE agents');
        const hasVoiceProvider = agentColumns.some(col => col.Field === 'voice_provider');
        const hasVoiceProviderVoiceId = agentColumns.some(col => col.Field === 'voice_provider_voice_id');

        if (hasVoiceProvider && hasVoiceProviderVoiceId) {
            console.log('\n  ✓ agents table has voice provider columns');
        } else {
            console.log('\n  ⚠️  agents table missing some voice provider columns');
        }

    } catch (error) {
        console.error('\n❌ Error applying voices schema:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run migration
applyVoicesSchema();
