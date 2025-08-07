import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ExpensesDashboard from '@/components/expenses/ExpensesDashboard';

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  return <ExpensesDashboard />;
}