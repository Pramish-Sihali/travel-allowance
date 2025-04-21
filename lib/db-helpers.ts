// lib/db-helpers.ts

import { supabase } from './supabase';

/**
 * Gets a list of employees for group travel selection
 */
export async function getEmployeesForGroupTravel() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, department, designation')
      .eq('role', 'employee')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching employees:', error);
    return [];
  }
}

/**
 * Gets details of specific users by their IDs
 */
export async function getUsersByIds(userIds: string[]) {
  if (!userIds || userIds.length === 0) return [];
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, department, designation')
      .in('id', userIds);
    
    if (error) {
      console.error('Error fetching users by IDs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching users by IDs:', error);
    return [];
  }
}