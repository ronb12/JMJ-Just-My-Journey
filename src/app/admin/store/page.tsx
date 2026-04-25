import { getProducts } from "@/lib/data/public";
import { ProductEditor } from "./ProductEditor";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminStore() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  const list = (await getProducts()) as {
    id: string;
    name: string;
    price: string;
    stock_quantity: number;
    category: string | null;
  }[];
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Store & inventory</h1>
      <ProductEditor initial={list} />
    </div>
  );
}
