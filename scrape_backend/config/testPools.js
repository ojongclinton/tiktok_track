// Test script

import { readPool, writePool } from "./database.js";

const testPools = async () => {
  // Test write pool
  const writeConn = await writePool.getConnection();
  await writeConn.execute('SELECT 1');
  writeConn.release();
  console.log('✅ Write pool working');
  
  // Test read pool  
  const readConn = await readPool.getConnection();
  await readConn.execute('SELECT COUNT(*) FROM ticktok_users');
  readConn.release();
  console.log('✅ Read pool working');
};

testPools();
