import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getAdminProducts, createProduct, deleteProduct } from "@/lib/admin.functions";
import { getCsrfToken } from "@/lib/admin/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

const inr = (v: string) => `₹${Number(v).toLocaleString("en-IN")}`;

function AdminProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => getAdminProducts(),
  });
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const products = data ?? [];

  const filtered = products.filter((p) => {
    if (typeFilter !== "all" && (p.productType || "").toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.handle.toLowerCase().includes(q) ||
      (p.vendor || "").toLowerCase().includes(q)
    );
  });

  const categories = Array.from(new Set(products.map((p) => p.productType).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Eyewear Catalog</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your frame collections, variants, pricing, and Shopify inventory sync.
          </p>
        </div>
        <CreateProductDialog
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["admin", "products"] })}
        />
      </div>

      {/* Filter and Search */}
      <div className="grid gap-3 sm:grid-cols-3 bg-card p-4 rounded-2xl border border-border/70 shadow-xs">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search frames by title, style, handle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl text-xs bg-background h-10"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full h-10 rounded-xl text-xs bg-background border border-border/70 px-3 text-foreground"
          >
            <option value="all">All Frame Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading optical catalog…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-card/40">
          <h3 className="font-display text-base font-semibold text-foreground">No frames found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search query or category filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
              <tr>
                <th className="px-5 py-3.5">Frame Title & Style</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Retail Price</th>
                <th className="px-4 py-3.5">Stock Level</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3.5">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-11 w-11 rounded-xl object-cover border border-border/60 bg-muted shrink-0"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-xl border border-border/60 bg-muted/60 flex items-center justify-center text-muted-foreground font-bold text-xs shrink-0">
                          LM
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-foreground text-sm">{product.title}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">/{product.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {product.productType || "Eyeglasses"}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-foreground text-sm">
                    {inr(product.price)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-foreground border border-border/50">
                      {product.totalInventory ?? 10} in stock
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        product.status === "active"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <a
                      href={`/product/${product.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2.5 py-1 rounded-lg border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      View ↗
                    </a>
                    <DeleteButton
                      productId={product.id}
                      title={product.title}
                      onDeleted={() =>
                        queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateProductDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(createProduct);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(false);
    const form = new FormData(e.currentTarget);
    try {
      await create({
        data: {
          title: String(form.get("title") || ""),
          description: String(form.get("description") || ""),
          productType: String(form.get("productType") || ""),
          vendor: String(form.get("vendor") || "Lens Master"),
          tags: String(form.get("tags") || ""),
          price: String(form.get("price") || "0"),
          csrfToken: getCsrfToken(),
        },
      });
      setOpen(false);
      onCreated();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> New Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Skyline Aviator" />
          </div>
          <div>
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" name="price" type="number" step="0.01" required placeholder="850" />
          </div>
          <div>
            <Label htmlFor="productType">Product Type</Label>
            <Input id="productType" name="productType" placeholder="Optical Frame" />
          </div>
          <div>
            <Label htmlFor="vendor">Vendor / Brand</Label>
            <Input id="vendor" name="vendor" placeholder="Lens Master" />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" name="tags" placeholder="blue-cut, aviator" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Premium titanium frame with blue cut lenses…"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">Could not create product. Try again.</p>
          )}
          <Button type="submit" disabled={saving} className="w-full rounded-full">
            {saving ? "Creating…" : "Create Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({
  productId,
  title,
  onDeleted,
}: {
  productId: string;
  title: string;
  onDeleted: () => void;
}) {
  const del = useServerFn(deleteProduct);
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}" from Shopify?`)) return;
    setSaving(true);
    try {
      await del({ data: { productId, csrfToken: getCsrfToken() } });
      onDeleted();
    } catch {
      alert("Could not delete product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={saving}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
