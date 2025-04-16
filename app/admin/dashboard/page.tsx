import { requireRole } from "@/lib/server/auth";
import Header from '@/components/layout/Header';
import AdminDashboardContent from '@/components/admin/AdminDashboardContent';

export default async function AdminDashboardPage() {
  // Ensure the user is an admin
  const user = await requireRole(["admin"]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="admin" />
      
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          <AdminDashboardContent user={user} />
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}