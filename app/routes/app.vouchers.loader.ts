// app/routes/vouchers.tsx  (or wherever your route lives)
import { json, LoaderFunction } from "@remix-run/node";
import { getAllVouchers } from "~/models/voucher.server";

export const loader: LoaderFunction = async () => {
  const vouchers = await getAllVouchers();
  return json({ vouchers });
};
