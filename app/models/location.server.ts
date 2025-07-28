import prisma from "../db.server";


// createLocation.
export async function createLocation(name: string) {
  return prisma.location.create({
    data: { name },
  });
}

// getAllLocations.
export async function getAllLocations() {
  return prisma.location.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// getLocationById.
export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
  });
}

// deleteLocation.
export async function deleteLocation(id: string) {
  return prisma.location.delete({
    where: { id },
  });
}

// updateLocation.
export async function updateLocation(id: string, name: string) {
  return prisma.location.update({
    where: { id },
    data: { name },
  });
}
