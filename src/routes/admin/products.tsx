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

  const products = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your eyewear catalogue.
          </p>
        </div>
        <CreateProductDialog
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["admin", "products"] })}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="rounded-xl border p-6 text-sm text-muted-foreground">
          No products found.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Inventory</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{product.title}</div>
                        <div className="text-xs text-muted-foreground">{product.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.productType || "—"}
                  </td>
                  <td className="px-4 py-3">{inr(product.price)}</td>
                  <td className="px-4 py-3">{product.totalInventory}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        product.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
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
          vendor: String(form.get("vendor") || ""),
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
