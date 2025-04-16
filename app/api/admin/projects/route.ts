// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch projects from the database
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Transform data to the format expected by the client
    const projectOptions = data.map(project => ({
      value: project.id,
      label: project.name
    }));
    
    // Always include "other" option
    projectOptions.push({ value: "other", label: "Other" });
    
    return NextResponse.json(projectOptions);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin privileges (would use requireRole in real implementation)
    
    // Get project data from request
    const projectData = await request.json();
    
    // Validate request body
    if (!projectData.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // Insert new project
    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: projectData.name }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Return new project
    return NextResponse.json(
      { value: data.id, label: data.name },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}