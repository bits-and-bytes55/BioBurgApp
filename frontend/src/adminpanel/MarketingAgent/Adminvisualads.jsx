// adminpanel/MarketingAgent/AdminVisualAds.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import toast from "react-hot-toast";

const BASE = API_BASE_URL;

const TYPE_COLORS = {
  image: "bg-blue-100 text-blue-700",
  video: "bg-purple-100 text-purple-700",
};

const TARGET_COLORS = {
  all: "bg-green-100 text-green-700",
  specific: "bg-orange-100 text-orange-700",
};

/* ─── tiny helpers ─────────────────────────────────────────── */
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* ─── Upload Progress bar ──────────────────────────────────── */
function ProgressBar({ value }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/* ─── Modal ────────────────────────────────────────────────── */
function AdModal({ ad, agents, onClose, onSaved }) {
  const isEdit = Boolean(ad?._id);
  const fileRef = useRef();

  const [form, setForm] = useState({
    title: ad?.title || "",
    description: ad?.description || "",
    targetType: ad?.targetType || "all",
    targetAgents: ad?.targetAgents?.map((a) => a._id || a) || [],
    tags: ad?.tags?.join(", ") || "",
    isActive: ad?.isActive !== undefined ? ad.isActive : true,
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAgentToggle = (id) => {
    setForm((prev) => ({
      ...prev,
      targetAgents: prev.targetAgents.includes(id)
        ? prev.targetAgents.filter((a) => a !== id)
        : [...prev.targetAgents, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!isEdit && !file) return toast.error("Please select a media file");

    setUploading(true);
    setProgress(10);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        targetType: form.targetType,
        targetAgents: form.targetType === "specific" ? form.targetAgents : [],
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isActive: form.isActive,
      };

      if (file) {
        const b64 = await toBase64(file);
        setProgress(40);
        payload.mediaBase64 = b64;
        payload.mediaMime = file.type;
      }

      setProgress(60);

      if (isEdit) {
        await axios.put(`${BASE}/api/admin/visual-ads/${ad._id}`, payload, {
          headers: authHeader(),
        });
        toast.success("Ad updated!");
      } else {
        await axios.post(`${BASE}/api/admin/visual-ads`, payload, {
          headers: authHeader(),
        });
        toast.success("Ad created!");
      }

      setProgress(100);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? "Edit Ad" : "Create Visual Ad"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ad title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
            />
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEdit ? "Replace Media (optional)" : "Upload Image / Video *"}
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                file?.type.startsWith("video") ? (
                  <video
                    src={preview}
                    className="mx-auto max-h-40 rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={preview}
                    alt="preview"
                    className="mx-auto max-h-40 rounded-lg object-contain"
                  />
                )
              ) : ad?.mediaUrl && !preview ? (
                ad.mediaType === "video" ? (
                  <video
                    src={ad.mediaUrl}
                    className="mx-auto max-h-40 rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={ad.mediaUrl}
                    alt="current"
                    className="mx-auto max-h-40 rounded-lg object-contain"
                  />
                )
              ) : (
                <div className="text-gray-400 py-4">
                  <div className="text-3xl mb-1">📁</div>
                  <p className="text-sm">Click to select image or video</p>
                  <p className="text-xs text-gray-300 mt-1">
                    JPG, PNG, MP4, MOV, WEBM
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="product, offer, pharma..."
            />
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex gap-3">
              {["all", "specific"].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, targetType: t })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    form.targetType === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {t === "all" ? "All Agents" : "Specific Agents"}
                </button>
              ))}
            </div>
          </div>

          {/* Agent selector */}
          {form.targetType === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agents
              </label>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {agents.length === 0 && (
                  <p className="text-sm text-gray-400 p-3">No agents found</p>
                )}
                {agents.map((a) => (
                  <label
                    key={a._id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.targetAgents.includes(a._id)}
                      onChange={() => handleAgentToggle(a._id)}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {a.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.assignedArea || a.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <span className="text-sm font-medium text-gray-700">
              {form.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {uploading && <ProgressBar value={progress} />}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploading ? "Uploading…" : isEdit ? "Save Changes" : "Create Ad"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Ad Card ──────────────────────────────────────────────── */
function AdCard({ ad, onEdit, onDelete, onToggle }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Media preview */}
      <div className="relative h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
        {ad.mediaType === "video" ? (
          <video
            src={ad.mediaUrl}
            poster={ad.thumbnailUrl || undefined}
            className="w-full h-full object-cover"
            muted
            playsInline
            onMouseEnter={(e) => e.target.play()}
            onMouseLeave={(e) => {
              e.target.pause();
              e.target.currentTime = 0;
            }}
          />
        ) : (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[ad.mediaType]}`}
          >
            {ad.mediaType}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TARGET_COLORS[ad.targetType]}`}
          >
            {ad.targetType === "all" ? "All Agents" : "Specific"}
          </span>
        </div>
        {/* Active indicator */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              ad.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {ad.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
          {ad.title}
        </h3>
        {ad.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{ad.description}</p>
        )}

        {/* Tags */}
        {ad.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.tags.map((t) => (
              <span
                key={t}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Target agents list (specific) */}
        {ad.targetType === "specific" && ad.targetAgents?.length > 0 && (
          <p className="text-xs text-orange-600">
            {ad.targetAgents
              .map((a) => (typeof a === "object" ? a.name : a))
              .join(", ")}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-auto">
          {new Date(ad.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="border-t flex divide-x">
        <button
          onClick={() => onToggle(ad)}
          className="flex-1 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
        >
          {ad.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => onEdit(ad)}
          className="flex-1 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(ad)}
          className="flex-1 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export default function AdminVisualAds() {
  const [ads, setAds] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | "create" | ad object

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [search, setSearch] = useState("");

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("mediaType", filterType);
      if (filterTarget) params.append("targetType", filterTarget);
      if (filterActive !== "") params.append("isActive", filterActive);
      if (search) params.append("search", search);

      const { data } = await axios.get(
        `${BASE}/api/admin/visual-ads?${params.toString()}`,
        { headers: authHeader() }
      );
      setAds(data.ads || []);
    } catch (err) {
      toast.error("Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get(`${BASE}/api/admin/marketing-agents`, {
        headers: authHeader(),
      });
      setAgents(data.agents || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchAds();
  }, [filterType, filterTarget, filterActive]);

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete "${ad.title}"? This will also remove it from Cloudinary.`))
      return;
    try {
      await axios.delete(`${BASE}/api/admin/visual-ads/${ad._id}`, {
        headers: authHeader(),
      });
      toast.success("Ad deleted!");
      fetchAds();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleToggle = async (ad) => {
    try {
      const { data } = await axios.patch(
        `${BASE}/api/admin/visual-ads/${ad._id}/toggle`,
        {},
        { headers: authHeader() }
      );
      toast.success(data.message);
      fetchAds();
    } catch (err) {
      toast.error("Toggle failed");
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") fetchAds();
  };

  const stats = {
    total: ads.length,
    images: ads.filter((a) => a.mediaType === "image").length,
    videos: ads.filter((a) => a.mediaType === "video").length,
    active: ads.filter((a) => a.isActive).length,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visual / Digital Ads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload and manage images & videos shown to marketing agents
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          <span className="text-base">+</span> New Ad
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Ads", value: stats.total, color: "bg-slate-100 text-slate-800" },
          { label: "Images", value: stats.images, color: "bg-blue-100 text-blue-800" },
          { label: "Videos", value: stats.videos, color: "bg-purple-100 text-purple-800" },
          { label: "Active", value: stats.active, color: "bg-emerald-100 text-emerald-800" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search title… (Enter)"
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-52"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>

        <select
          value={filterTarget}
          onChange={(e) => setFilterTarget(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">All Targets</option>
          <option value="all">All Agents</option>
          <option value="specific">Specific</option>
        </select>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={fetchAds}
          className="border rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No ads found</p>
          <p className="text-sm mt-1">Click "New Ad" to upload your first visual ad</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ads.map((ad) => (
            <AdCard
              key={ad._id}
              ad={ad}
              onEdit={(a) => setModal(a)}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <AdModal
          ad={modal === "create" ? null : modal}
          agents={agents}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchAds();
          }}
        />
      )}
    </div>
  );
}