// lib/db-helpers.ts

import { supabase } from './supabase';

/**
 * Gets a list of employees for group travel selection (organization-filtered)
 */
export async function getEmployeesForGroupTravel(organizationId?: string) {
  try {
    let query = supabase
      .from('users')
      .select('id, name, email, department, designation')
      .order('name', { ascending: true });
    
    // Add organization filter if provided and valid
    if (organizationId && organizationId !== 'undefined') {
      query = query.eq('organization_id', organizationId);
    } else {
      // If no organization or undefined, get users with null organization_id
      query = query.is('organization_id', null);
    }
    
    const { data, error } = await query;
    
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
 * Gets details of specific users by their IDs (organization-filtered)
 */
export async function getUsersByIds(userIds: string[], organizationId?: string) {
  if (!userIds || userIds.length === 0) return [];
  
  try {
    let query = supabase
      .from('users')
      .select('id, name, email, department, designation')
      .in('id', userIds);
    
    // Add organization filter if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    
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

/**
 * Gets approvers for a specific organization
 */
export async function getApproversForOrganization(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, department, designation')
      .eq('role', 'approver')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching approvers:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching approvers:', error);
    return [];
  }
}