import { json } from "@remix-run/node";
import createLocation from "../../models/location.server"

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return json({ error: "Name is required" }, { status: 400 });
    }

    const location = await createLocation(name);
    return json({ location }, { status: 201 });

  } catch (error) {
    console.error("API Error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
