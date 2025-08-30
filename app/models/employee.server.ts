//@ts-nocheck
import prisma from "../db.server";

// createEmployee.
export async function createEmployee(username: string, email?: string, locationId?: string, password?: string) {
  return prisma.employee.create({
    data: { username, email, locationId, password},
    include: { location: true},
  });
}

// getAllEmployees.
export async function getAllEmployees() {
  return prisma.employee.findMany({
    include: {location: true},
  });
}

// updateEmployee.
export async function updateEmployee(id: string, username?: string, email?: string, locationId?: string, password?: string) {
  return prisma.employee.update({
    where: { id },
    data: {...(username && { username }), ...(email && { email }), ...(locationId && { locationId }), ...(password && { password })},
    include: { location: true },
  });
}
