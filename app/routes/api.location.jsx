// app/routes/api.location.jsx
// Imports.
import { json } from "@remix-run/node";
import prisma from "../db.server";


// Action.
// Location create.
export const action = async ({ request }) => {
  const method = request.method;

  if (method === "POST") {
    try {
      const body = await request.json();
      const { name } = body;

      if (!name) {
        return json({ error: "Location name is required" }, { status: 400 });
      }

      const location = await prisma.location.create({
        data: { name },
      });

      console.log("✅ Location stored:", location);
      return json({ success: true, location });
    } catch (error) {
      console.error("❌ Error saving location:", error);
      return json({ error: "Failed to save location" }, { status: 500 });
    }
  }

  if (method === "DELETE") {
    try {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return json({ error: "Location ID is required" }, { status: 400 });
      }

      const deleted = await prisma.location.delete({
        where: { id },
      });

      console.log("🗑️ Deleted location:", deleted);
      return json({ success: true });
    } catch (error) {
      console.error("❌ Error deleting location:", error);
      return json({ error: "Failed to delete location" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};
