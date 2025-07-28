import prisma from "../db.server";
// import { json } from "@remix-run/node";

// export const action = async ({ request }: { request: Request }) => {
//   try {
//     const body = await request.json();
//     const { name } = body;

//     if (!name) {
//       return json({ error: "Name is required" }, { status: 400 });
//     }

//     const location = await prisma.location.create({
//       data: {
//         name,
//       },
//     });

//     return json({ success: true, location }, { status: 201 });
//   } catch (error) {
//     console.error("Error creating location:", error);
//     return json({ error: "Internal server error" }, { status: 500 });
//   }
// };

export async function createLocation(name: string) {
  return prisma.location.create({
    data: { name },
  });
}

// Get all locations (e.g., for admin or employees)
export async function getAllLocations() {
  return prisma.location.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// Optional: Get a specific location by ID
export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
  });
}

// Delete a location by ID
export async function deleteLocation(id: string) {
  return prisma.location.delete({
    where: { id },
  });
}
