"use client";

import * as React from "react";
import {
  FolderTree,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { BlogNav } from "@/components/admin/cms/blog-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  _count: {
    blogs: number;
  };
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    status: "ACTIVE",
  });

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cms/blog-categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const json = await res.json();
      setCategories(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", status: "ACTIVE" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, status: cat.status });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Category name is required");
      return;
    }
    setSubmitting(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const payload = editingId ? { id: editingId, ...form } : form;

      const res = await fetch("/api/v1/cms/blog-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save category");
      }

      toast.success(editingId ? "Category updated" : "Category created");
      setIsDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this category?")) return;
    try {
      const res = await fetch(`/api/v1/cms/blog-categories?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete category");
      }
      toast.success("Category deleted");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">CMS & Blog Suite</h1>
        <p className="text-sm text-muted-foreground">
          Organize editorial articles, travel guides, road trip recommendations, and vehicle reviews.
        </p>
      </div>

      <BlogNav />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Content Topics & Taxonomies</CardTitle>
            <CardDescription>
              Categories used to group published blog posts and guide customer exploration.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCategories()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
              <Plus className="size-3.5" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>URL Slug</TableHead>
                  <TableHead>Published Articles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading categories...
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No categories found. Click "Add Category" to create your first topic.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold text-sm">
                        {c.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        /blog/category/{c.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs gap-1">
                          <FileText className="size-3" />
                          {c._count.blogs} posts
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === "ACTIVE" ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          className="h-8 text-primary"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "Create Blog Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="catName">Category Name</Label>
              <Input
                id="catName"
                placeholder="e.g. Travel Itineraries, Car Maintenance"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catSlug">URL Slug (Optional)</Label>
              <Input
                id="catSlug"
                placeholder="Auto-generated if left blank"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val: any) => setForm({ ...form, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingId ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
