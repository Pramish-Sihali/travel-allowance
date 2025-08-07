'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Building, Calendar, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import PersonalLogsSection from '@/components/profile/PersonalLogsSection';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
  type: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    designation: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchLeaveBalances();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/${session?.user?.id}/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          name: data.name || '',
          department: data.department || '',
          designation: data.designation || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      // This would be implemented based on your leave management system
      // For now, showing placeholder data
      setLeaveBalances([
        { type: 'Annual Leave', total: 21, used: 5, remaining: 16 },
        { type: 'Sick Leave', total: 10, used: 2, remaining: 8 },
        { type: 'Personal Leave', total: 5, used: 1, remaining: 4 }
      ]);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/user/${session?.user?.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: profile?.name || '',
      department: profile?.department || '',
      designation: profile?.designation || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="employee" />
        <div className="flex">
          <Sidebar userRole="employee" />
          <main className="flex-1 md:ml-64 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="employee" />
      
      <div className="flex">
        <Sidebar userRole="employee" />
        
        <main className={cn(
          "flex-1 transition-all duration-200",
          "md:ml-64",
          "p-6"
        )}>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground font-lato">Profile</h1>
                <p className="text-muted-foreground font-nunito mt-1">
                  Manage your personal information and view leave balances
                </p>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="font-nunito"
                      />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md font-nunito">
                        {profile?.name || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="p-2 bg-muted/50 rounded-md font-nunito flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {profile?.email || 'Not specified'}
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        value={editForm.department}
                        onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                        className="font-nunito"
                      />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md font-nunito flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {profile?.department || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    {isEditing ? (
                      <Input
                        id="designation"
                        value={editForm.designation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                        className="font-nunito"
                      />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md font-nunito">
                        {profile?.designation || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="p-2 bg-muted/50 rounded-md">
                      <Badge variant="secondary" className="capitalize">
                        {profile?.role || 'Employee'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="p-2 bg-muted/50 rounded-md font-nunito flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {profile?.created_at ? formatDate(profile.created_at) : 'Not available'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Leave Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {leaveBalances.map((leave, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">{leave.type}</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Total:</span>
                              <span className="font-medium">{leave.total} days</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Used:</span>
                              <span className="font-medium text-red-600">{leave.used} days</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Remaining:</span>
                              <span className="font-bold text-green-600">{leave.remaining} days</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personal Activity Logs */}
            <PersonalLogsSection />

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-mono text-xs">{profile?.id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{profile?.updated_at ? formatDate(profile.updated_at) : 'Never'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}