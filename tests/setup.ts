import { beforeAll, afterAll } from 'vitest';
import { supabase } from '../src/config/supabase';

// Test database setup
beforeAll(async () => {
  // Setup test data if needed
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test data
  console.log('Cleaning up test environment...');
});