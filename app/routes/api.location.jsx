// app/routes/api.location.jsx
// Imports.
import { json } from "@remix-run/node";
import prisma from "../db.server";


// Action.
export const action = async ({ request }) => {
  const method = request.method;

  // CREATE
  if (method === "POST") {
    try {
      const body = await request.json();
      const { name } = body;

      if (!name) {
        return json({ error: "Name are required" }, { status: 400 });
      }

      const location = await prisma.location.create({
        data: { name },
      });

      console.log("✅ Location created:", location);
      return json({ success: true, location });
    } catch (error) {
      console.error("❌ Error creating location:", error);
      return json({ error: "Failed to create location" }, { status: 500 });
    }
  }

  // UPDATE
  if (method === "PUT") {
    try {
      const body = await request.json();
      const { id, name } = body;

      if (!id || !name) {
        return json({ error: "ID and name are required for update" }, { status: 400 });
      }

      const updated = await prisma.location.update({
        where: { id },
        data: { name },
      });

      console.log("✏️ Updated location:", updated);
      return json({ success: true, location: updated });
    } catch (error) {
      console.error("❌ Error updating location:", error);
      return json({ error: "Failed to update location" }, { status: 500 });
    }
  }

  // DELETE
  if (method === "DELETE") {
    try {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return json({ error: "ID is required for deletion" }, { status: 400 });
      }

      const deleted = await prisma.location.delete({
        where: { id },
      });

      console.log("🗑️ Deleted location:", deleted);
      return json({ success: true, deleted });
    } catch (error) {
      console.error("❌ Error deleting location:", error);
      return json({ error: "Failed to delete location" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};
