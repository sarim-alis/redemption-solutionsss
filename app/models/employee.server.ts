import prisma from "../db.server";

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

 