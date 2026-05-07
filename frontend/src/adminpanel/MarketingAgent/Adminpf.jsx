import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

// constants 
const RECOMMEND_MAP = {
  "definitely-yes": { label: "Definitely Yes", emoji: "🔥", color: "#16a34a", bg: "#dcfce7" },
  "probably-yes":   { label: "Probably Yes",   emoji: "😊", color: "#2563eb", bg: "#dbeafe" },
  "not-sure":       { label: "Not Sure",        emoji: "🤔", color: "#d97706", bg: "#fef3c7" },
  "probably-no":    { label: "Probably No",     emoji: "😟", color: "#ea580c", bg: "#ffedd5" },
  "definitely-no":  { label: "Definitely No",   emoji: "💔", color: "#dc2626", bg: "#fee2e2" },
};

const RATING_COLOR = ["", "#dc2626", "#ea580c", "#d97706", "#16a34a", "#2563eb"];
const PER_PAGE = 9;

// tiny helpers 
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

const StarRating = ({ value }) => (
  <span style={{ letterSpacing: 1 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} style={{ color: s <= value ? RATING_COLOR[value] : "#d1d5db", fontSize: 15 }}>
        ★
      </span>
    ))}
  </span>
);

const Chip = ({ label, emoji, color, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    color, background: bg, whiteSpace: "nowrap" }}>
    {emoji} {label}
  </span>
);

const Tag = ({ children, color = "#2563eb", bg = "#dbeafe" }) => (
  <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11,
    fontWeight: 600, color, background: bg }}>
    {children}
  </span>
);

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
    padding: "16px 20px", flex: "1 1 130px", minWidth: 120 }}>
    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: color || "#111827" }}>{value}</div>
  </div>
);

const FieldBlock = ({ label, value }) =>
  value ? (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb",
        borderRadius: 10, padding: "10px 14px", fontSize: 13,
        color: "#374151", lineHeight: 1.65 }}>
        {value}
      </div>
    </div>
  ) : null;

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
    <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 130 }}>{label}</span>
    <span style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{value || "—"}</span>
  </div>
);

const selSx = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db",
  fontSize: 13, background: "#fff", cursor: "pointer",
};

const PagBtn = ({ children, active, disabled, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    style={{
      padding: "6px 13px", borderRadius: 8, border: "1px solid #d1d5db",
      background: active ? "#2563eb" : disabled ? "#f3f4f6" : "#fff",
      color: active ? "#fff" : disabled ? "#9ca3af" : "#374151",
      cursor: disabled ? "default" : "pointer",
      fontSize: 13, fontWeight: active ? 700 : 400,
    }}
  >
    {children}
  </button>
);

//  DETAIL VIEW 
const DetailView = ({ fb, onBack }) => {
  const rec = RECOMMEND_MAP[fb.would_recommend] || {};
  return (
    <div style={{ paddingBottom: 32 }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#2563eb", fontWeight: 700, fontSize: 13, marginBottom: 20 }}
      >
        ← Back to list
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 16, maxWidth: 860 }}>

        {/* Left — feedback content */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 16, padding: "24px 26px" }}>

          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                {fb.product_name}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                {fb.category}
                {fb.product_code  ? ` · Code: ${fb.product_code}`   : ""}
                {fb.batch_number  ? ` · Batch: ${fb.batch_number}`  : ""}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column",
              alignItems: "flex-end", gap: 6 }}>
              <StarRating value={fb.rating} />
              {rec.label && <Chip {...rec} />}
            </div>
          </div>

          <FieldBlock label="Overall Experience"          value={fb.overall_experience} />
          <FieldBlock label="Detailed Feedback"           value={fb.feedback_text} />
          <FieldBlock label="Specific Issue / Observation" value={fb.specific_issue} />
          <FieldBlock label="Suggestions for Improvement" value={fb.suggestions} />
        </div>

        {/* Right — meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151",
              marginBottom: 14, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
              👤 Submitter Info
            </div>
            <InfoRow label="Name"           value={fb.submitter_name} />
            <InfoRow label="Type"           value={fb.submitter_type} />
            <InfoRow label="Phone"          value={fb.submitter_phone} />
            <InfoRow label="Email"          value={fb.submitter_email} />
            <InfoRow label="Organization"   value={fb.organization_name} />
            <InfoRow label="Specialization" value={fb.specialization} />
            <InfoRow label="Location"       value={`${fb.city}, ${fb.state}`} />
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151",
              marginBottom: 14, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
              Product Usage
            </div>
            <InfoRow label="Source"            value={fb.product_source} />
            <InfoRow label="Using Since"       value={fb.how_long} />
            <InfoRow label="Feedback Type"     value={fb.feedback_type} />
            <InfoRow label="Patient Age Group" value={fb.patient_age_group} />
            <InfoRow label="Prescriptions"     value={fb.prescription_count} />
            <InfoRow label="Submitted"         value={fmtDate(fb.submitted_at || fb.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  );
};

//  MAIN COMPONENT 
const AdminProductFeedback = () => {
  const [feedbacks, setFeedbacks]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [search, setSearch]               = useState("");
  const [filterRec, setFilterRec]         = useState("all");
  const [filterRating, setFilterRating]   = useState("all");
  const [filterType, setFilterType]       = useState("all");
  const [sortBy, setSortBy]               = useState("newest");
  const [selected, setSelected]           = useState(null);
  const [page, setPage]                   = useState(1);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/public/product-feedback`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // controller returns { success, count, data }
        setFeedbacks(res.data?.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load feedback.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // derived stats 
  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : "—";

  const positiveCount = feedbacks.filter(
    (f) => f.would_recommend === "definitely-yes" || f.would_recommend === "probably-yes"
  ).length;

  const thisMonth = feedbacks.filter((f) => {
    const d = new Date(f.submitted_at || f.createdAt);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  const submitterTypes = [...new Set(feedbacks.map((f) => f.submitter_type).filter(Boolean))];

  //  filter + sort 
  const filtered = feedbacks
    .filter((f) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (f.submitter_name    || "").toLowerCase().includes(q) ||
        (f.product_name      || "").toLowerCase().includes(q) ||
        (f.organization_name || "").toLowerCase().includes(q) ||
        (f.city              || "").toLowerCase().includes(q) ||
        (f.specific_issue    || "").toLowerCase().includes(q);
      const matchRec    = filterRec    === "all" || f.would_recommend === filterRec;
      const matchRating = filterRating === "all" || String(f.rating)  === filterRating;
      const matchType   = filterType   === "all" || f.submitter_type  === filterType;
      return matchSearch && matchRec && matchRating && matchType;
    })
    .sort((a, b) => {
      const da = new Date(a.submitted_at || a.createdAt);
      const db = new Date(b.submitted_at || b.createdAt);
      if (sortBy === "newest")      return db - da;
      if (sortBy === "oldest")      return da - db;
      if (sortBy === "rating-high") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "rating-low")  return (a.rating || 0) - (b.rating || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // detail view 
  if (selected) return <DetailView fb={selected} onBack={() => setSelected(null)} />;

  //  list view 
  return (
    <div style={{ paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>
         Product Feedback
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          Feedback submitted by field agents &amp; submitters
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Total Feedback"   value={feedbacks.length} color="#2563eb" />
        <StatCard label="Avg. Rating"      value={`${avgRating}/5`} color="#d97706" />
        <StatCard label="Positive Reviews" value={positiveCount}    color="#16a34a" />
        <StatCard label="This Month"       value={thisMonth}        color="#7c3aed" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10,
        background: "#f9fafb", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>

        <input
          placeholder="Search name, product, org, city…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: "1 1 200px", padding: "8px 12px", borderRadius: 8,
            border: "1px solid #d1d5db", fontSize: 13, outline: "none", minWidth: 160 }}
        />

        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} style={selSx}>
          <option value="all">All Submitter Types</option>
          {submitterTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={filterRec} onChange={(e) => { setFilterRec(e.target.value); setPage(1); }} style={selSx}>
          <option value="all">All Recommendations</option>
          {Object.entries(RECOMMEND_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>

        <select value={filterRating} onChange={(e) => { setFilterRating(e.target.value); setPage(1); }} style={selSx}>
          <option value="all">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{"★".repeat(r)} {r} Star{r > 1 ? "s" : ""}</option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selSx}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="rating-high">Rating: High → Low</option>
          <option value="rating-low">Rating: Low → High</option>
        </select>
      </div>

      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
        Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> results
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
          Loading feedback…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: 12, padding: "18px 22px", color: "#dc2626", fontSize: 14 }}>
           {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>No feedback found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && paginated.length > 0 && (
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
          {paginated.map((fb) => {
            const rec = RECOMMEND_MAP[fb.would_recommend] || {};
            return (
              <div
                key={fb._id}
                onClick={() => setSelected(fb)}
                style={{ background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 14, padding: "18px 20px", cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Product + rating */}
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827",
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", maxWidth: "60%" }}>
                    {fb.product_name}
                  </div>
                  <StarRating value={fb.rating} />
                </div>

                {/* Tag row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  <Tag color="#6d28d9" bg="#ede9fe">{fb.submitter_type}</Tag>
                  <Tag color="#0369a1" bg="#e0f2fe">{fb.category}</Tag>
                  {fb.feedback_type && (
                    <Tag color="#065f46" bg="#d1fae5">{fb.feedback_type}</Tag>
                  )}
                </div>

                {/* Who */}
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 3 }}>
                   <strong>{fb.submitter_name}</strong>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                   {fb.organization_name} &nbsp;·&nbsp;  {fb.city}, {fb.state}
                </div>

                {/* Feedback preview */}
                {fb.feedback_text && (
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.55,
                    marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    "{fb.feedback_text}"
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
                  {rec.label ? <Chip {...rec} /> : <span />}
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    {fmtDate(fb.submitted_at || fb.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center",
          gap: 6, marginTop: 30, flexWrap: "wrap" }}>
          <PagBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</PagBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PagBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PagBtn>
          ))}
          <PagBtn disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</PagBtn>
        </div>
      )}
    </div>
  );
};

export default AdminProductFeedback;