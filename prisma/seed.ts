import { PrismaClient, Role, MaritalStatus, EmploymentType, Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create default organization
  const organization = await prisma.organization.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Demo Travel Company',
      code: 'DEMO',
      timezone: 'Asia/Kolkata',
      settings: {
        expenseLimit: 50000,
        travelPolicy: 'Standard travel policy',
        workingHours: '9:00-18:00'
      }
    }
  })

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Human Resources',
        description: 'HR Department',
        organizationId: organization.id,
      }
    }),
    prisma.department.create({
      data: {
        name: 'Finance',
        description: 'Finance Department', 
        organizationId: organization.id,
      }
    }),
    prisma.department.create({
      data: {
        name: 'Operations',
        description: 'Operations Department',
        organizationId: organization.id,
      }
    }),
    prisma.department.create({
      data: {
        name: 'Sales',
        description: 'Sales Department',
        organizationId: organization.id,
      }
    })
  ])

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create users with different roles
  const users = [
    {
      role: Role.SUPER_ADMIN,
      name: 'Super Admin',
      email: 'superadmin@demo.com',
      employeeId: 'SA001',
      department: 'Administration',
      designation: 'Super Administrator'
    },
    {
      role: Role.ADMIN,
      name: 'Admin User',
      email: 'admin@demo.com', 
      employeeId: 'AD001',
      department: 'Administration',
      designation: 'Administrator'
    },
    {
      role: Role.HR_ADMIN,
      name: 'HR Admin',
      email: 'hradmin@demo.com',
      employeeId: 'HR001',
      department: 'Human Resources',
      designation: 'HR Manager'
    },
    {
      role: Role.FINANCE,
      name: 'Finance Manager',
      email: 'finance@demo.com',
      employeeId: 'FN001', 
      department: 'Finance',
      designation: 'Finance Manager'
    },
    {
      role: Role.MANAGER,
      name: 'Operations Manager',
      email: 'manager@demo.com',
      employeeId: 'MG001',
      department: 'Operations', 
      designation: 'Operations Manager'
    },
    {
      role: Role.APPROVER,
      name: 'Travel Approver',
      email: 'approver@demo.com',
      employeeId: 'AP001',
      department: 'Operations',
      designation: 'Travel Approver'
    },
    {
      role: Role.CHECKER,
      name: 'Travel Checker', 
      email: 'checker@demo.com',
      employeeId: 'CH001',
      department: 'Finance',
      designation: 'Travel Checker'
    },
    {
      role: Role.EMPLOYEE,
      name: 'John Employee',
      email: 'employee1@demo.com',
      employeeId: 'EM001',
      department: 'Sales',
      designation: 'Sales Executive'
    },
    {
      role: Role.EMPLOYEE,
      name: 'Jane Employee',
      email: 'employee2@demo.com', 
      employeeId: 'EM002',
      department: 'Operations',
      designation: 'Operations Executive'
    },
    {
      role: Role.EMPLOYEE,
      name: 'Mike Employee',
      email: 'employee3@demo.com',
      employeeId: 'EM003',
      department: 'Sales', 
      designation: 'Senior Sales Executive'
    }
  ]

  const createdUsers = []
  
  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        organizationId: organization.id,
        joinDate: new Date('2024-01-01'),
        managerId: userData.role === Role.EMPLOYEE ? 
          (userData.department === 'Sales' ? null : null) : null // Will set manager relations later
      }
    })
    createdUsers.push(user)
  }

  // Set manager relationships
  const manager = createdUsers.find(u => u.role === Role.MANAGER)
  const approver = createdUsers.find(u => u.role === Role.APPROVER)
  
  // Update employees to have managers
  for (const user of createdUsers) {
    if (user.role === Role.EMPLOYEE) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          managerId: user.department === 'Operations' ? manager?.id : approver?.id
        }
      })
    }
  }

  // Create employee profiles
  for (const user of createdUsers) {
    await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        personalEmail: user.email.replace('@demo.com', '@personal.com'),
        phone: `+91-98765-${Math.floor(Math.random() * 90000) + 10000}`,
        emergencyContact: `Emergency Contact for ${user.name}`,
        emergencyPhone: `+91-98765-${Math.floor(Math.random() * 90000) + 10000}`,
        address: `${Math.floor(Math.random() * 999) + 1}, Demo Street, Demo City, India`,
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        nationality: 'Indian',
        maritalStatus: Math.random() > 0.5 ? MaritalStatus.MARRIED : MaritalStatus.SINGLE,
        employmentType: EmploymentType.FULL_TIME,
        salary: new Prisma.Decimal(user.role === Role.EMPLOYEE ? 50000 : 
                   user.role === Role.MANAGER ? 80000 : 
                   user.role === Role.APPROVER ? 70000 : 
                   user.role === Role.FINANCE ? 85000 : 100000),
        salaryGrade: user.role === Role.EMPLOYEE ? 'E1' : 
                    user.role === Role.MANAGER ? 'M2' : 
                    user.role === Role.APPROVER ? 'M1' : 'S1',
        annualLeaveBalance: 24,
        sickLeaveBalance: 12,
        personalLeaveBalance: 6,
        bankName: 'Demo Bank',
        accountNumber: `DEMO${Math.floor(Math.random() * 900000000) + 100000000}`,
        ifscCode: 'DEMO0001234',
        organizationId: organization.id
      }
    })
  }

  // Create some sample projects
  await prisma.project.create({
    data: {
      name: 'Client Onboarding Project',
      description: 'New client onboarding initiative',
      organizationId: organization.id
    }
  })

  await prisma.project.create({
    data: {
      name: 'Business Expansion',
      description: 'Expanding to new markets',
      organizationId: organization.id
    }
  })

  console.log('🌱 Seed data created successfully!')
  console.log(`✅ Organization: ${organization.name}`)
  console.log(`✅ Users created: ${createdUsers.length}`)
  console.log(`✅ Departments created: ${departments.length}`)
  console.log('\n👥 Demo Users:')
  console.log('Email: superadmin@demo.com | Password: password123 | Role: Super Admin')
  console.log('Email: admin@demo.com | Password: password123 | Role: Admin')
  console.log('Email: hradmin@demo.com | Password: password123 | Role: HR Admin')
  console.log('Email: finance@demo.com | Password: password123 | Role: Finance')
  console.log('Email: manager@demo.com | Password: password123 | Role: Manager')
  console.log('Email: approver@demo.com | Password: password123 | Role: Approver')
  console.log('Email: checker@demo.com | Password: password123 | Role: Checker')
  console.log('Email: employee1@demo.com | Password: password123 | Role: Employee')
  console.log('Email: employee2@demo.com | Password: password123 | Role: Employee')
  console.log('Email: employee3@demo.com | Password: password123 | Role: Employee')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })