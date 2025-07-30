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
    const address = formData.get("address");
    const password = formData.get("password");

    try {
      const employee = await prisma.employee.create({
        data: {
          username,
          email,
          address,
          password,
        },
      });

      return json({ success: true, employee });
    } catch (error) {
      console.error("Error creating employee:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return json({ message: "Method Not Allowed" }, { status: 405 });
};


