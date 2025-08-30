// app/routes/api.employee.jsx
// Imports.
import { json } from "@remix-run/node";
import prisma from "../db.server";


// Action.
export const action = async ({ request }) => {
  const method = request.method;

  if (method === "POST") {
    const formData = await request.formData();
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    const locationId = formData.get("locationId");

    try {
      const employee = await prisma.employee.create({
        data: { username, email, password, locationId},
        include: { location: true },
      });

      return json({ success: true, employee });
    } catch (error) {
      console.error("Error creating employee:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }

  if (method === "DELETE") {
    const formData = await request.formData();
    const id = formData.get("id");

    try {
      await prisma.employee.delete({
        where: { id },
      });
      return json({ success: true });
    } catch (error) {
      console.error("Error deleting employee:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return json({ message: "Method Not Allowed" }, { status: 405 });
};
