//@ts-nocheck
import prisma from "../db.server";

// createEmployee.
export async function createEmployee(username: string, email?: string, address?: string, password?: string) {
  return prisma.employee.create({
    data: {
      username,
      email,
      address,
      password,
    },
  });
}

// getAllEmployees.
 export async function getAllEmployees() {
  return prisma.employee.findMany();
}
