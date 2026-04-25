import { getCategories, getProducts } from "@/lib/data/public";
import { StoreClient } from "./StoreClient";
import { FadeIn } from "@/components/ui/FadeIn";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function StorePage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const products = await getProducts({ q, category });
  const categories = await getCategories();
  return (
    <div className="jmj-container py-10">
      <FadeIn>
        <h1 className="font-serif text-4xl text-[#1E3A8A]">Wellness store</h1>
        <p className="mt-2 text-slate-600">Curated for calm minds and soft skin. Prices verified at checkout.</p>
      </FadeIn>
      <StoreClient
        products={
          products as {
            id: string;
            name: string;
            price: string;
            image_url: string | null;
            category: string | null;
            stock_quantity: number;
          }[]
        }
        categories={categories}
        initialQ={q || ""}
        initialCategory={category || ""}
      />
    </div>
  );
}
