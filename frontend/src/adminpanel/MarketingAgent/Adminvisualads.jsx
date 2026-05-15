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

/* ─── Product Selector (fetches real products like ProductFeedback page) ── */
function ProductSelector({ selectedIds, onChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Use admin products endpoint (fallback to agent endpoint)
    axios
      .get(`${BASE}/api/admin/products`, { headers: authHeader() })
      .then(({ data }) => setProducts(data.products || data.data || []))
      .catch(() =>
        // Fallback: try agent endpoint
        fetch(`${BASE}/api/agent/products`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        })
          .then((r) => r.json())
          .then((d) => setProducts(d.products || []))
          .catch(() => {})
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (p.title || p.name || "").toLowerCase().includes(q) ||
      (p.brandName || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  });

  const toggle = (id) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p._id));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Link to Products <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      {/* Selected chips */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedProducts.map((p) => (
            <span
              key={p._id}
              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium"
            >
              {p.title || p.name}
              <button
                type="button"
                onClick={() => toggle(p._id)}
                className="text-blue-400 hover:text-blue-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products by name, brand, category..."
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
      />

      <div className="border rounded-lg max-h-44 overflow-y-auto divide-y bg-white">
        {loading ? (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">
            {search ? "No products match" : "No products found"}
          </div>
        ) : (
          filtered.map((p) => {
            const checked = selectedIds.includes(p._id);
            return (
              <label
                key={p._id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${
                  checked ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p._id)}
                  className="accent-blue-600 w-4 h-4 flex-shrink-0"
                />
                {p.image?.url && (
                  <img
                    src={p.image.url}
                    alt=""
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.title || p.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {[p.brandName, p.category].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {p.price && (
                  <span className="text-xs font-semibold text-blue-600 font-mono flex-shrink-0">
                    ₹{Number(p.price).toLocaleString("en-IN")}
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
      {products.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">{products.length} products available</p>
      )}
    </div>
  );
}

/* ─── Single file item in multi-upload queue ──────────────── */
function FileQueueItem({ item, index, onRemove, onUpdate }) {
  const [preview] = useState(() =>
    item.file ? URL.createObjectURL(item.file) : null
  );

  return (
    <div className="flex items-start gap-3 p-3 border rounded-xl bg-gray-50">
      {/* Thumbnail */}
      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
        {preview ? (
          item.file.type.startsWith("video") ? (
            <video src={preview} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📁</div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          className="w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Title for file ${index + 1} *`}
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
        <input
          className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description (optional)"
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
        <input
          className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tags: comma-separated"
          value={item.tags}
          onChange={(e) => onUpdate({ tags: e.target.value })}
        />
        <p className="text-xs text-gray-400 truncate">{item.file?.name} · {item.file?.type.startsWith("video") ? "🎬 Video" : "🖼 Image"}</p>
      </div>

      <button
        onClick={onRemove}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition text-lg font-bold"
      >
        ×
      </button>
    </div>
  );
}

/* ─── Create Modal (multi-upload) ─────────────────────────── */
function CreateModal({ agents, onClose, onSaved }) {
  const fileRef = useRef();
  const [fileItems, setFileItems] = useState([]); // [{file, title, description, tags}]
  const [linkedProductIds, setLinkedProductIds] = useState([]);
  const [targetType, setTargetType] = useState("all");
  const [targetAgents, setTargetAgents] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState([]); // per-file status

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map((f) => ({
      file: f,
      title: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      description: "",
      tags: "",
    }));
    setFileItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const updateItem = (idx, patch) => {
    setFileItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const removeItem = (idx) => {
    setFileItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAgentToggle = (id) => {
    setTargetAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (fileItems.length === 0) return toast.error("Please select at least one file");
    const missingTitle = fileItems.find((f) => !f.title.trim());
    if (missingTitle) return toast.error("All files need a title");

    setUploading(true);
    setUploadStatus(fileItems.map(() => "pending"));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileItems.length; i++) {
      const item = fileItems[i];
      setProgress(Math.round(((i) / fileItems.length) * 100));
      setUploadStatus((s) => s.map((v, idx) => (idx === i ? "uploading" : v)));

      try {
        const b64 = await toBase64(item.file);
        const payload = {
          title: item.title.trim(),
          description: item.description.trim(),
          targetType,
          targetAgents: targetType === "specific" ? targetAgents : [],
          linkedProducts: linkedProductIds,
          tags: item.tags.split(",").map((t) => t.trim()).filter(Boolean),
          isActive,
          mediaBase64: b64,
          mediaMime: item.file.type,
        };

        await axios.post(`${BASE}/api/admin/visual-ads`, payload, {
          headers: authHeader(),
        });

        setUploadStatus((s) => s.map((v, idx) => (idx === i ? "done" : v)));
        successCount++;
      } catch (err) {
        setUploadStatus((s) => s.map((v, idx) => (idx === i ? "error" : v)));
        failCount++;
        console.error(`Upload failed for "${item.title}":`, err);
      }
    }

    setProgress(100);

    if (successCount > 0) toast.success(`${successCount} ad${successCount > 1 ? "s" : ""} created!`);
    if (failCount > 0) toast.error(`${failCount} upload${failCount > 1 ? "s" : ""} failed`);

    setUploading(false);
    if (successCount > 0) {
      setTimeout(() => {
        onSaved();
      }, 800);
    }
  };

  const statusIcon = (s) => {
    if (s === "pending") return <span className="text-gray-400 text-xs">⏳</span>;
    if (s === "uploading") return <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    if (s === "done") return <span className="text-green-500 text-xs">✓</span>;
    if (s === "error") return <span className="text-red-500 text-xs">✗</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Create Visual Ads</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload multiple images / videos at once</p>
          </div>
          <button onClick={onClose} disabled={uploading} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Files <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">— select multiple</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-3xl mb-2">📁</div>
              <p className="text-sm text-gray-600 font-medium">Click to select images or videos</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, MP4, MOV, WEBM · Multiple files OK</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFiles}
            />
          </div>

          {/* File queue */}
          {fileItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  {fileItems.length} file{fileItems.length > 1 ? "s" : ""} selected
                </p>
                {!uploading && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add more
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {fileItems.map((item, i) => (
                  <div key={i} className="relative">
                    {uploadStatus[i] && (
                      <div className="absolute top-3 right-10 z-10">{statusIcon(uploadStatus[i])}</div>
                    )}
                    <FileQueueItem
                      item={item}
                      index={i}
                      onRemove={() => !uploading && removeItem(i)}
                      onUpdate={(patch) => !uploading && updateItem(i, patch)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product linking */}
          <ProductSelector
            selectedIds={linkedProductIds}
            onChange={setLinkedProductIds}
          />

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-3">
              {["all", "specific"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    targetType === t
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
          {targetType === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Agents</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {agents.length === 0 && (
                  <p className="text-sm text-gray-400 p-3">No agents found</p>
                )}
                {agents.map((a) => (
                  <label key={a._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={targetAgents.includes(a._id)}
                      onChange={() => handleAgentToggle(a._id)}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.assignedArea || a.email}</p>
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
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <span className="text-sm font-medium text-gray-700">
              {isActive ? "Active (visible to agents)" : "Inactive (hidden)"}
            </span>
          </div>

          {uploading && (
            <div>
              <ProgressBar value={progress} />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Uploading {Math.ceil((progress / 100) * fileItems.length)} of {fileItems.length}…
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || fileItems.length === 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploading
              ? `Uploading ${uploadStatus.filter((s) => s === "done").length}/${fileItems.length}…`
              : `Upload ${fileItems.length > 0 ? `${fileItems.length} ` : ""}Ad${fileItems.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Modal (single ad) ──────────────────────────────── */
function EditModal({ ad, agents, onClose, onSaved }) {
  const fileRef = useRef();

  const [form, setForm] = useState({
    title: ad.title || "",
    description: ad.description || "",
    targetType: ad.targetType || "all",
    targetAgents: ad.targetAgents?.map((a) => a._id || a) || [],
    tags: ad.tags?.join(", ") || "",
    isActive: ad.isActive !== undefined ? ad.isActive : true,
  });
  const [linkedProductIds, setLinkedProductIds] = useState(
    ad.linkedProducts?.map((p) => p._id || p) || []
  );
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
    setUploading(true);
    setProgress(10);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        targetType: form.targetType,
        targetAgents: form.targetType === "specific" ? form.targetAgents : [],
        linkedProducts: linkedProductIds,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        isActive: form.isActive,
      };

      if (file) {
        const b64 = await toBase64(file);
        setProgress(50);
        payload.mediaBase64 = b64;
        payload.mediaMime = file.type;
      }

      setProgress(70);
      await axios.put(`${BASE}/api/admin/visual-ads/${ad._id}`, payload, {
        headers: authHeader(),
      });
      setProgress(100);
      toast.success("Ad updated!");
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Edit Ad</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Replace media */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace Media (optional)</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                file?.type.startsWith("video") ? (
                  <video src={preview} className="mx-auto max-h-36 rounded-lg" controls />
                ) : (
                  <img src={preview} alt="preview" className="mx-auto max-h-36 rounded-lg object-contain" />
                )
              ) : ad.mediaType === "video" ? (
                <video src={ad.mediaUrl} className="mx-auto max-h-36 rounded-lg" controls muted />
              ) : (
                <img src={ad.mediaUrl} alt="current" className="mx-auto max-h-36 rounded-lg object-contain" />
              )}
              <p className="text-xs text-gray-400 mt-2">Click to replace</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="product, offer, pharma..."
            />
          </div>

          <ProductSelector selectedIds={linkedProductIds} onChange={setLinkedProductIds} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-3">
              {["all", "specific"].map((t) => (
                <button
                  key={t}
                  type="button"
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

          {form.targetType === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Agents</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {agents.map((a) => (
                  <label key={a._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.targetAgents.includes(a._id)}
                      onChange={() => handleAgentToggle(a._id)}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.assignedArea || a.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <span className="text-sm font-medium text-gray-700">{form.isActive ? "Active" : "Inactive"}</span>
          </div>

          {uploading && <ProgressBar value={progress} />}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploading ? "Saving…" : "Save Changes"}
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
      <div className="relative h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
        {ad.mediaType === "video" ? (
          <video
            src={ad.mediaUrl}
            poster={ad.thumbnailUrl || undefined}
            className="w-full h-full object-cover"
            muted
            playsInline
            onMouseEnter={(e) => e.target.play()}
            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
          />
        ) : (
          <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[ad.mediaType]}`}>
            {ad.mediaType}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TARGET_COLORS[ad.targetType]}`}>
            {ad.targetType === "all" ? "All Agents" : "Specific"}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ad.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
            {ad.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{ad.title}</h3>
        {ad.description && <p className="text-xs text-gray-500 line-clamp-2">{ad.description}</p>}

        {/* Linked products */}
        {ad.linkedProducts?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.linkedProducts.slice(0, 2).map((p) => (
              <span key={p._id || p} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {typeof p === "object" ? p.title || p.name : p}
              </span>
            ))}
            {ad.linkedProducts.length > 2 && (
              <span className="text-xs text-gray-400">+{ad.linkedProducts.length - 2}</span>
            )}
          </div>
        )}

        {ad.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.tags.map((t) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>
        )}

        {ad.targetType === "specific" && ad.targetAgents?.length > 0 && (
          <p className="text-xs text-orange-600">
            {ad.targetAgents.map((a) => (typeof a === "object" ? a.name : a)).join(", ")}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-auto">
          {new Date(ad.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="border-t flex divide-x">
        <button onClick={() => onToggle(ad)} className="flex-1 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition">
          {ad.isActive ? "Deactivate" : "Activate"}
        </button>
        <button onClick={() => onEdit(ad)} className="flex-1 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition">
          Edit
        </button>
        <button onClick={() => onDelete(ad)} className="flex-1 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition">
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
  const [modal, setModal] = useState(null); // null | "create" | ad object (edit)

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
    } catch {
      toast.error("Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get(`${BASE}/api/admin/marketing-agents`, { headers: authHeader() });
      setAgents(data.agents || []);
    } catch (_) {}
  };

  useEffect(() => { fetchAds(); }, [filterType, filterTarget, filterActive]);
  useEffect(() => { fetchAgents(); }, []);

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete "${ad.title}"? This will also remove it from Cloudinary.`)) return;
    try {
      await axios.delete(`${BASE}/api/admin/visual-ads/${ad._id}`, { headers: authHeader() });
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
    } catch {
      toast.error("Toggle failed");
    }
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
          <p className="text-sm text-gray-500 mt-0.5">Upload and manage images & videos shown to marketing agents</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          <span className="text-base">+</span> New Ads
        </button>
      </div>

      {/* Stats */}
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
          onKeyDown={(e) => e.key === "Enter" && fetchAds()}
          placeholder="Search title… (Enter)"
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-52"
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        <select value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All Targets</option>
          <option value="all">All Agents</option>
          <option value="specific">Specific</option>
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button onClick={fetchAds} className="border rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition">
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
          <p className="text-sm mt-1">Click "New Ads" to upload your first visual ad</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ads.map((ad) => (
            <AdCard key={ad._id} ad={ad} onEdit={(a) => setModal(a)} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === "create" && (
        <CreateModal
          agents={agents}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAds(); }}
        />
      )}
      {modal && modal !== "create" && (
        <EditModal
          ad={modal}
          agents={agents}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAds(); }}
        />
      )}
    </div>
  );
}