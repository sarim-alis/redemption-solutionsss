// app/routes/api.location.jsx
// Imports.
import { json } from "@remix-run/node";
import prisma from "../db.server";


// Action.
// Location create.
export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return json({ error: "Location name is required" }, { status: 400 });
    }

    const location = await prisma.location.create({
      data: {
        name
      },
    });

    console.log("✅ Location stored:", location);

    return json({ success: true, location });
  } catch (error) {
    console.error("❌ Error saving location:", error);
    return json({ error: "Failed to save location" }, { status: 500 });
  }
};
