'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HeaderProps {
  variant?: 'employee' | 'approver' | 'checker' | 'admin';
}

export default function Header({ variant = 'employee' }: HeaderProps) {
  const { data: session, status } = useSession();
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Define variant-specific properties
  const variantStyles = {
    employee: {
      gradientFrom: 'from-blue-700',
      gradientTo: 'to-blue-500',
      buttonBg: 'bg-blue-800',
      buttonHover: 'hover:bg-blue-900',
    },
    approver: {
      gradientFrom: 'from-green-700',
      gradientTo: 'to-green-500',
      buttonBg: 'bg-green-800',
      buttonHover: 'hover:bg-green-900',
    },
    checker: {
      gradientFrom: 'from-purple-700',
      gradientTo: 'to-purple-500',
      buttonBg: 'bg-purple-800',
      buttonHover: 'hover:bg-purple-900',
    },
    admin: {
      gradientFrom: 'from-gray-900',
      gradientTo: 'to-gray-700',
      buttonBg: 'bg-gray-800',
      buttonHover: 'hover:bg-gray-900',
    },
  };

  const styles = variantStyles[variant];

  useEffect(() => {
    // Check if user has a name, if not, show dialog after a short delay
    if (status === 'authenticated' && !session?.user?.name) {
      const timer = setTimeout(() => setIsNameDialogOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [session, status]);

  const updateName = async () => {
    if (!name.trim()) return;
    
    setIsUpdating(true);
    try {
      // API call to update user name
      const response = await fetch('/api/user/update-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (response.ok) {
        // Force refresh session to get updated name
        window.location.reload();
      } else {
        console.error('Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsUpdating(false);
      setIsNameDialogOpen(false);
    }
  };

  return (
    <>
      <header className={`bg-gradient-to-r ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-md`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <svg 
              className="w-8 h-8" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M16 16V8H8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight">Travel Allowance System</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <UserCircle className="w-5 h-5" />
              <span className="font-medium">
                Welcome, {session?.user?.name || variant.charAt(0).toUpperCase() + variant.slice(1)}
              </span>
            </div>
            <Button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md ${styles.buttonBg} ${styles.buttonHover} transition-colors`}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Please provide your name</DialogTitle>
            <DialogDescription>
              We need your name to personalize your experience.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Enter your full name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={updateName} disabled={isUpdating || !name.trim()}>
              {isUpdating ? 'Updating...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}