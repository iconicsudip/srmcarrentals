"use client";

import * as React from "react";
import {
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { BlogNav } from "@/components/admin/cms/blog-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  content: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishDate: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
  };
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function BlogPostsPage() {
  const [blogs, setBlogs] = React.useState<BlogPostItem[]>([]);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    slug: "",
    categoryId: "",
    featuredImage: "",
    content: "",
    tags: "",
    status: "DRAFT",
  });

  const fetchBlogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/cms/blog?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load blog posts");
      const json = await res.json();
      setBlogs(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/cms/blog-categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      categoryId: categories[0]?.id || "",
      featuredImage: "",
      content: "",
      tags: "",
      status: "DRAFT",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (post: BlogPostItem) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      categoryId: post.category?.id || "",
      featuredImage: post.featuredImage || "",
      content: post.content || "",
      tags: post.tags?.join(", ") || "",
      status: post.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.categoryId) {
      toast.error("Title and Category are required");
      return;
    }
    setSubmitting(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const payload: any = {
        ...form,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };
      if (editingId) payload.id = editingId;

      const res = await fetch("/api/v1/cms/blog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save post");
      }

      toast.success(editingId ? "Article updated" : "Article published/drafted");
      setIsDialogOpen(false);
      fetchBlogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to save post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await fetch(`/api/v1/cms/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete article");
      toast.success("Article deleted");
      fetchBlogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete article");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="success">Published</Badge>;
      case "DRAFT":
        return <Badge variant="warning">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">CMS & Blog Suite</h1>
        <p className="text-sm text-muted-foreground">
          Publish automotive guides, travel stories, customer tips, and road trip itineraries.
        </p>
      </div>

      <BlogNav />

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Articles
            </CardTitle>
            <Newspaper className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Written editorial posts</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Topic Categories
            </CardTitle>
            <Tag className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Taxonomies available</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Search Indexing
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Automatic</div>
            <p className="text-xs text-muted-foreground mt-1">Sitemap sync on publish</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Reader Engagement
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~4 min</div>
            <p className="text-xs text-muted-foreground mt-1">Average article read time</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Published & Drafted Posts</CardTitle>
            <CardDescription>
              All articles published to /blog with category assignments and publish schedules.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBlogs()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
              <Plus className="size-3.5" />
              Write Article
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search title, slug..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading articles...
                    </TableCell>
                  </TableRow>
                ) : blogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No blog articles found. Click "Write Article" to publish content.
                    </TableCell>
                  </TableRow>
                ) : (
                  blogs.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{b.title}</div>
                        <div className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                          /blog/{b.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {b.category?.name || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.author
                          ? `${b.author.firstName || ""} ${b.author.lastName || ""}`.trim() || b.author.email
                          : "Editorial Team"}
                      </TableCell>
                      <TableCell>{getStatusBadge(b.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.publishDate
                          ? new Date(b.publishDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Unpublished"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(b)}
                          className="h-8 text-primary"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(b.id)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div>
              Showing page {page} of {totalPages} ({total} total records)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Blog Article" : "Write New Article"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="postTitle">Article Title</Label>
              <Input
                id="postTitle"
                placeholder="e.g. Top 10 Scenic Road Trips from Bangalore"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="postSlug">Custom Slug (Optional)</Label>
                <Input
                  id="postSlug"
                  placeholder="auto-generated-from-title"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="categorySelect">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(val) => setForm({ ...form, categoryId: val })}
                >
                  <SelectTrigger id="categorySelect">
                    <SelectValue placeholder="Choose category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="postImg">Featured Image URL</Label>
                <Input
                  id="postImg"
                  placeholder="/blog/roadtrip.jpg or CDN link"
                  value={form.featuredImage}
                  onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Publication Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published (Go Live)</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postTags">Tags (comma separated)</Label>
              <Input
                id="postTags"
                placeholder="road trips, travel, western ghats, self drive"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postContent">Article Body (Markdown / Text)</Label>
              <Textarea
                id="postContent"
                rows={6}
                placeholder="Write your article content here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
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
                {submitting ? "Saving..." : editingId ? "Update Article" : "Save Article"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
