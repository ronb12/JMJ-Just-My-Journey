import { getProduct } from "@/lib/data/public";
import { notFound } from "next/navigation";
import { ProductAdd } from "./ProductAdd";
import { GlassCard } from "@/components/ui/GlassCard";
import Image from "next/image";
import Link from "next/link";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) {
    notFound();
  }
  const name = String(p.name);
  const price = String(p.price);
  const desc = p.description != null ? String(p.description) : null;
  const category = p.category != null ? String(p.category) : null;
  const image = p.image_url != null ? String(p.image_url) : null;
  const stock = Number(p.stock_quantity);
  return (
    <div className="jmj-container py-10">
      <Link className="text-sm text-sky-700" href="/store">
        &larr; Back to store
      </Link>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <GlassCard className="p-0 overflow-hidden">
          <div className="relative aspect-square bg-sky-50/50">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover"
                unoptimized={image.startsWith("/")}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No image</div>
            )}
          </div>
        </GlassCard>
        <div>
          {category ? (
            <p className="text-sm font-medium uppercase tracking-wide text-sky-600">{category}</p>
          ) : null}
          <h1 className="mt-1 font-serif text-4xl text-[#1E3A8A]">{name}</h1>
          {desc ? <p className="mt-4 text-slate-600">{desc}</p> : null}
          <p className="mt-6 text-3xl text-[#2563EB]">${price}</p>
          <p className="mt-1 text-sm text-slate-500">In stock: {stock}</p>
          {stock > 0 ? <ProductAdd productId={id} /> : <p className="mt-4 text-rose-600">Out of stock</p>}
          <div className="mt-4">
            <Link href="/cart">
              <LuxuryButton type="button" variant="ghost">
                View cart
              </LuxuryButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
