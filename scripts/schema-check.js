// Simple script to check database schema directly in your Next.js app
// Save this as scripts/simple-schema-check.js

// Import your existing Supabase client
const { supabase } = require('../lib/supabase');

async function checkDatabaseColumns() {
  console.log('Checking emergency and advance columns in travel_requests table...');
  
  const requiredColumns = [
    'emergency_reason',
    'emergency_reason_other',
    'emergency_justification',
    'emergency_amount',
    'estimated_amount',
    'advance_notes'
  ];
  
  try {
    // Check if columns exist by querying them directly
    const { data, error } = await supabase
      .from('travel_requests')
      .select(requiredColumns.join(','))
      .limit(1);
    
    if (error) {
      console.error('Error querying columns:', error);
      
      // If error contains details about missing columns, extract them
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\nColumn error detected. Missing column in query.');
        const missingColumnMatch = error.message.match(/column "([^"]+)" does not exist/);
        if (missingColumnMatch && missingColumnMatch[1]) {
          console.log(`Missing column detected: ${missingColumnMatch[1]}`);
        }
      }
      
      return;
    }
    
    console.log('All required columns exist in the database.');
    
    // Check for emergency requests
    const { data: emergencyData, error: emergencyError } = await supabase
      .from('travel_requests')
      .select('id, request_type, emergency_reason, emergency_justification, emergency_amount')
      .eq('request_type', 'emergency')
      .limit(5);
    
    if (emergencyError) {
      console.error('Error querying emergency requests:', emergencyError);
    } else {
      console.log(`\nFound ${emergencyData.length} emergency requests:`);
      console.log(emergencyData);
    }
    
    // Check for advance requests
    const { data: advanceData, error: advanceError } = await supabase
      .from('travel_requests')
      .select('id, request_type, estimated_amount, advance_notes')
      .eq('request_type', 'advance')
      .limit(5);
    
    if (advanceError) {
      console.error('Error querying advance requests:', advanceError);
    } else {
      console.log(`\nFound ${advanceData.length} advance requests:`);
      console.log(advanceData);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkDatabaseColumns()
  .then(() => console.log('Schema check completed.'))
  .catch(err => console.error('Fatal error:', err));