// lib/db.ts

import { TravelRequest, ExpenseItem, Receipt, Notification } from '@/types';
import { UserRole } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';

// This is a simple in-memory db for development
// In production, you would use a real database

let travelRequests: TravelRequest[] = [];
let expenseItems: ExpenseItem[] = [];
let receipts: Receipt[] = [];
let notifications: Notification[] = [];

// User data for authentication
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export const users: User[] = [
  {
    id: "1",
    email: "employee@example.com",
    name: "Employee User",
    password: "password123", // In a real app, this would be hashed
    role: "employee"
  },
  {
    id: "2",
    email: "approver@example.com",
    name: "Approver User",
    password: "password123",
    role: "approver"
  },
  {
    id: "3",
    email: "checker@example.com",
    name: "Checker User",
    password: "password123",
    role: "checker"
  },
  {
    id: "4",
    email: "admin@example.com",
    name: "Admin User",
    password: "password123",
    role: "admin"
  }
];

// User functions
export const getUserByEmail = (email: string) => 
  users.find(user => user.email === email);

export const getUserById = (id: string) => 
  users.find(user => user.id === id);

export const getAllUsers = () => [...users];

// Travel Requests
export const getAllTravelRequests = () => [...travelRequests];
export const getTravelRequestsByEmployeeId = (employeeId: string) => 
  travelRequests.filter(req => req.employeeId === employeeId);
export const getTravelRequestById = (id: string) => 
  travelRequests.find(req => req.id === id);
export const createTravelRequest = (data: Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newRequest: TravelRequest = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  travelRequests.push(newRequest);
  return newRequest;
};
export const updateTravelRequestStatus = (id: string, status: TravelRequest['status']) => {
  const index = travelRequests.findIndex(req => req.id === id);
  if (index !== -1) {
    travelRequests[index] = {
      ...travelRequests[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    return travelRequests[index];
  }
  return null;
};

// Expense Items
export const getExpenseItemsByRequestId = (requestId: string) => 
  expenseItems.filter(item => item.requestId === requestId);
export const createExpenseItem = (data: Omit<ExpenseItem, 'id'>) => {
  const newItem: ExpenseItem = {
    ...data,
    id: uuidv4(),
  };
  expenseItems.push(newItem);
  return newItem;
};

// Receipts
export const getReceiptsByExpenseItemId = (expenseItemId: string) => 
  receipts.filter(receipt => receipt.expenseItemId === expenseItemId);
export const createReceipt = (data: Omit<Receipt, 'id' | 'uploadDate'>) => {
  const newReceipt: Receipt = {
    ...data,
    id: uuidv4(),
    uploadDate: new Date().toISOString(),
  };
  receipts.push(newReceipt);
  return newReceipt;
};

// Notifications
export const getNotificationsByUserId = (userId: string) => 
  notifications.filter(notif => notif.userId === userId);
export const createNotification = (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
  const newNotification: Notification = {
    ...data,
    id: uuidv4(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(newNotification);
  return newNotification;
};
export const markNotificationAsRead = (id: string) => {
  const index = notifications.findIndex(notif => notif.id === id);
  if (index !== -1) {
    notifications[index] = {
      ...notifications[index],
      isRead: true,
    };
    return notifications[index];
  }
  return null;
};