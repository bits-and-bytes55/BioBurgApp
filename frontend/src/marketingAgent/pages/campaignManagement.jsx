import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Tabs, Tab,
  CircularProgress, Tooltip, Avatar, Divider,
  useTheme, useMediaQuery, InputAdornment, Paper,
  LinearProgress, Alert, List, ListItem, ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Email, Campaign, WhatsApp, Share,
  Add, Edit, Delete, Close,
  People, Visibility, TouchApp, Star,
  Schedule, CheckCircle, DraftsOutlined, ErrorOutline,
  Search, Refresh, Instagram, Facebook, Twitter, LinkedIn,
  Launch, CloudUpload, Tag, DeleteForever,
  Check, ContentCopy,
} from "@mui/icons-material";

const API   = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem("agentToken");
const axiosAuth = () =>
  axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token()}` } });

/*  Channel definitions */
const TYPES = [
  { value: "email",    label: "Email",        icon: <Email    fontSize="small" />, color: "#2563eb" },
  { value: "social",   label: "Social Media", icon: <Share    fontSize="small" />, color: "#7c3aed" },
  { value: "whatsapp", label: "WhatsApp",     icon: <WhatsApp fontSize="small" />, color: "#16a34a" },
  { value: "sms",      label: "SMS",          icon: <Campaign fontSize="small" />, color: "#ea580c" },
];

// Social platform metadata — includes how to build a URL for each recipient
const PLATFORMS = [
  {
    value: "Instagram", color: "#e1306c",
    icon: <Instagram sx={{ fontSize: 16 }} />,
    recipientLabel: "Instagram Username(s)",
    recipientPlaceholder: "@username1, @username2",
    recipientHelp: "Enter Instagram @usernames. Clicking 'Open' loads their profile — tap Message there to DM them.",
    // Instagram has no public DM deep-link via web; open profile page instead
    buildUrl: (r, _msg) => `https://www.instagram.com/${r.replace(/^@/, "").trim()}/`,
    btnLabel: "Open Instagram Profile",
  },
  {
    value: "Facebook", color: "#1877f2",
    icon: <Facebook sx={{ fontSize: 16 }} />,
    recipientLabel: "Facebook Username(s)",
    recipientPlaceholder: "username1, username2",
    recipientHelp: "Enter Facebook usernames. Clicking 'Open' loads their profile — click Message to DM them.",
    buildUrl: (r, _msg) => `https://www.facebook.com/${r.replace(/^@/, "").trim()}`,
    btnLabel: "Open Facebook Profile",
  },
  {
    value: "Twitter", color: "#1da1f2",
    icon: <Twitter sx={{ fontSize: 16 }} />,
    recipientLabel: "Twitter @Handle(s)",
    recipientPlaceholder: "@handle1, @handle2",
    recipientHelp: "Enter Twitter handles. Clicking 'Open' launches a DM compose window with your message.",
    buildUrl: (r, msg) =>
      `https://twitter.com/messages/compose?text=${encodeURIComponent(msg)}`,
    btnLabel: "Open Twitter DM",
  },
  {
    value: "LinkedIn", color: "#0077b5",
    icon: <LinkedIn sx={{ fontSize: 16 }} />,
    recipientLabel: "LinkedIn Username(s)",
    recipientPlaceholder: "username1, username2",
    recipientHelp: "Enter LinkedIn profile slugs. Clicking 'Open' loads their profile — click Message there.",
    buildUrl: (r, _msg) => `https://www.linkedin.com/in/${r.replace(/^@/, "").trim()}/`,
    btnLabel: "Open LinkedIn Profile",
  },
];

const STATUS_META = {
  draft:     { label: "Draft",     color: "#64748b", bg: "#f1f5f9", icon: <DraftsOutlined sx={{ fontSize: 14 }} /> },
  scheduled: { label: "Scheduled", color: "#d97706", bg: "#fffbeb", icon: <Schedule      sx={{ fontSize: 14 }} /> },
  sent:      { label: "Sent",      color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle   sx={{ fontSize: 14 }} /> },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fef2f2", icon: <ErrorOutline  sx={{ fontSize: 14 }} /> },
};

const getPlatform = (name) => PLATFORMS.find(p => p.value === name);
const getType     = (val)  => TYPES.find(t => t.value === val) || TYPES[0];

/*  Build the URL to open for each recipient  */
const buildUrl = (type, platform, recipient, message, subject) => {
  const r = (recipient || "").trim();
  const m = message || "";
  if (type === "email") {
    return `mailto:${r}?subject=${encodeURIComponent(subject || "")}&body=${encodeURIComponent(m)}`;
  }
  if (type === "whatsapp") {
    const ph = r.replace(/\D/g, "");
    return `https://wa.me/${ph}?text=${encodeURIComponent(m)}`;
  }
  if (type === "sms") {
    const ph = r.replace(/\D/g, "");
    return `sms:${ph}?body=${encodeURIComponent(m)}`;
  }
  if (type === "social") {
    const p = getPlatform(platform);
    return p ? p.buildUrl(r, m) : null;
  }
  return null;
};

/* StatCard  */
const StatCard = ({ label, value, sub, color, icon }) => (
  <Card sx={{ borderRadius: 3, border: "1.5px solid", borderColor: color + "33", background: `linear-gradient(135deg,${color}0a 0%,#fff 100%)`, boxShadow: "none", height: "100%" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase", mb: 0.5 }}>{label}</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</Typography>
          {sub && <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.5 }}>{sub}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: color + "22", color, width: 40, height: 40, borderRadius: 2 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

const SendRecipientDialog = ({ campaign, open, onClose, onMarkSent }) => {
  const [opened, setOpened] = useState(new Set());
  const [copied, setCopied] = useState(false);

  // Reset when a new campaign is loaded
  useEffect(() => { if (open) setOpened(new Set()); }, [open, campaign?._id]);

  if (!campaign) return null;

  const typeInfo   = getType(campaign.type);
  const pMeta      = getPlatform(campaign.platform);
  const recipients = campaign.recipients || [];
  const allOpened  = recipients.length > 0 && opened.size >= recipients.length;

  const handleOpen = (recipient) => {
    const url = buildUrl(campaign.type, campaign.platform, recipient, campaign.message, campaign.subject);
    if (!url) { toast.error("Cannot build URL for this recipient"); return; }
    // email / sms use window.location (navigates current tab), others open new tab
    if (campaign.type === "email" || campaign.type === "sms") {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setOpened(prev => new Set([...prev, recipient]));
  };

  const copyMsg = () => {
    navigator.clipboard.writeText(campaign.message || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openBtnLabel = (r) => {
    if (campaign.type === "email")    return "Open Mail";
    if (campaign.type === "whatsapp") return "Open WhatsApp";
    if (campaign.type === "sms")      return "Open SMS";
    return pMeta?.btnLabel || "Open";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700, fontSize: 16, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ bgcolor: typeInfo.color + "18", color: typeInfo.color, width: 32, height: 32, borderRadius: 1.5 }}>
            {pMeta ? pMeta.icon : typeInfo.icon}
          </Avatar>
          Send via {typeInfo.label}{pMeta ? ` · ${campaign.platform}` : ""}
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Message preview + copy */}
        <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a", mb: 0.3 }}>{campaign.title}</Typography>
          {campaign.subject && <Typography sx={{ fontSize: 12, color: "#475569", mb: 0.3 }}>Subject: {campaign.subject}</Typography>}
          <Typography sx={{ fontSize: 12, color: "#64748b", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {campaign.message}
          </Typography>
          <Button size="small" onClick={copyMsg}
            startIcon={copied ? <Check sx={{ fontSize: 13 }} /> : <ContentCopy sx={{ fontSize: 13 }} />}
            sx={{ mt: 0.8, fontSize: 11, textTransform: "none", color: copied ? "#16a34a" : "#475569", p: 0 }}>
            {copied ? "Copied!" : "Copy message text"}
          </Button>
        </Box>

        {/* Channel hint */}
        <Alert severity="info" sx={{ mb: 2, fontSize: 12, py: 0.4, "& .MuiAlert-message": { py: 0.2 } }}>
          {campaign.type === "email"    && "Opens your default email client (Gmail etc.) for each address with the message pre-filled."}
          {campaign.type === "whatsapp" && "Opens WhatsApp Web/App for each number with your message pre-typed. Just press Send inside WhatsApp."}
          {campaign.type === "sms"      && "Opens your phone Messages app with the number and message pre-filled."}
          {campaign.type === "social"   && pMeta?.recipientHelp}
        </Alert>

        {/* Per-recipient buttons */}
        {recipients.length === 0 ? (
          <Alert severity="warning">No recipients in this campaign. Edit it to add some.</Alert>
        ) : (
          <>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#475569", mb: 1 }}>
              Recipients — click each to open the app ({opened.size}/{recipients.length} opened)
            </Typography>
            <List disablePadding sx={{ border: "1.5px solid #e2e8f0", borderRadius: 2, overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
              {recipients.map((r, i) => {
                const done = opened.has(r);
                return (
                  <ListItem key={i} divider={i < recipients.length - 1}
                    sx={{ py: 1, bgcolor: done ? "#f0fdf4" : "white", transition: "background 0.2s" }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          {done && <CheckCircle sx={{ fontSize: 16, color: "#16a34a", flexShrink: 0 }} />}
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: done ? "#16a34a" : "#0f172a", wordBreak: "break-all" }}>
                            {r}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" variant={done ? "outlined" : "contained"}
                        startIcon={done ? <Check sx={{ fontSize: 12 }} /> : <Launch sx={{ fontSize: 12 }} />}
                        onClick={() => handleOpen(r)}
                        sx={{
                          fontSize: 11, textTransform: "none", fontWeight: 700,
                          minWidth: 120,
                          ...(done
                            ? { borderColor: "#16a34a", color: "#16a34a", bgcolor: "transparent" }
                            : { bgcolor: typeInfo.color, color: "white", border: "none", "&:hover": { filter: "brightness(0.9)", bgcolor: typeInfo.color } }
                          ),
                        }}>
                        {done ? "Re-open" : openBtnLabel(r)}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} size="small" sx={{ color: "#64748b", textTransform: "none" }}>Close</Button>
        {recipients.length > 0 && !allOpened && (
          <Typography sx={{ fontSize: 11, color: "#94a3b8", alignSelf: "center", flex: 1, textAlign: "right" }}>
            Open all recipients to unlock Mark as Sent
          </Typography>
        )}
        <Button
          disabled={!allOpened}
          onClick={() => { onMarkSent(campaign._id); onClose(); }}
          variant="contained" size="small"
          startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
          sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, textTransform: "none", fontWeight: 700, "&.Mui-disabled": { bgcolor: "#d1fae5", color: "#6ee7b7" } }}>
          ✓ Mark as Sent
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ImageUploader  */
const ImageUploader = ({ value, onChange, onRemove }) => {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => { setPreview(value?.url || null); }, [value?.url]);

  const handle = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be < 5 MB"); return; }
    const r = new FileReader();
    r.onloadend = () => { setPreview(r.result); onChange({ base64: r.result.split(",")[1], mime: file.type, preview: r.result }); };
    r.readAsDataURL(file);
  };

  return (
    <Box>
      <input ref={ref} type="file" accept="image/*" hidden onChange={e => handle(e.target.files[0])} />
      {preview ? (
        <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", height: 110 }}>
          <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <IconButton size="small" onClick={() => { setPreview(null); onRemove(); }}
            sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.55)", color: "white", width: 24, height: 24 }}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ) : (
        <Box onClick={() => ref.current?.click()} sx={{ height: 76, border: "2px dashed #cbd5e1", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, cursor: "pointer", bgcolor: "#f8fafc", "&:hover": { borderColor: "#1d4ed8", bgcolor: "#eff6ff" }, transition: "all 0.2s" }}>
          <CloudUpload sx={{ fontSize: 20, color: "#94a3b8" }} />
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>Click to upload image (max 5 MB)</Typography>
        </Box>
      )}
    </Box>
  );
};

/* CampaignCard  */
const CampaignCard = ({ campaign, onEdit, onDelete, onSendClick }) => {
  const ti   = getType(campaign.type);
  const sm   = STATUS_META[campaign.status] || STATUS_META.draft;
  const pM   = campaign.platform ? getPlatform(campaign.platform) : null;
  const oR   = campaign.reach > 0 ? ((campaign.opens  / campaign.reach) * 100).toFixed(1) : 0;
  const cR   = campaign.opens > 0 ? ((campaign.clicks / campaign.opens)  * 100).toFixed(1) : 0;

  return (
    <Card sx={{ borderRadius: 3, border: "1.5px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.04)", transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 24px rgba(0,0,0,0.09)" } }}>
      <Box sx={{ height: 4, background: ti.color, borderRadius: "12px 12px 0 0" }} />
      <CardContent sx={{ p: 2.5 }}>
        {/* header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
            <Avatar sx={{ bgcolor: ti.color + "18", color: ti.color, width: 34, height: 34, borderRadius: 1.5, flexShrink: 0 }}>
              {pM ? pM.icon : ti.icon}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{campaign.title}</Typography>
              <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{ti.label}{pM ? ` · ${campaign.platform}` : ""}</Typography>
            </Box>
          </Box>
          <Chip label={sm.label} icon={sm.icon} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: sm.bg, color: sm.color, border: "none", height: 22, ml: 1, flexShrink: 0 }} />
        </Box>

        {/* image */}
        {campaign.image?.url && (
          <Box sx={{ mb: 1.5, borderRadius: 2, overflow: "hidden", height: 90 }}>
            <img src={campaign.image.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        )}

        {/* content */}
        {campaign.subject && <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#475569", mb: 0.3 }}>📧 {campaign.subject}</Typography>}
        <Typography sx={{ fontSize: 12, color: "#64748b", mb: 1.2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {campaign.message}
        </Typography>

        {/* recipients */}
        {(campaign.recipients || []).length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            {campaign.recipients.slice(0, 3).map((r, i) => (
              <Chip key={i} label={r} size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#f1f5f9", color: "#475569", maxWidth: 130, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} />
            ))}
            {campaign.recipients.length > 3 && (
              <Chip label={`+${campaign.recipients.length - 3} more`} size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#e2e8f0", color: "#64748b" }} />
            )}
          </Box>
        )}

        {/* tags */}
        {campaign.tags?.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
            {campaign.tags.slice(0, 3).map(t => (
              <Chip key={t} label={`#${t}`} size="small" sx={{ fontSize: 10, height: 17, bgcolor: "#f1f5f9", color: "#64748b" }} />
            ))}
          </Box>
        )}

        {/* sent metrics */}
        {campaign.status === "sent" && (
          <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 1.2, mb: 1.5 }}>
            <Grid container spacing={1}>
              {[
                { label: "Reach",  value: campaign.reach,                icon: <People    sx={{ fontSize: 13 }} /> },
                { label: "Opens",  value: campaign.opens,  sub: `${oR}%`, icon: <Visibility sx={{ fontSize: 13 }} /> },
                { label: "Clicks", value: campaign.clicks, sub: `${cR}%`, icon: <TouchApp   sx={{ fontSize: 13 }} /> },
                { label: "Conv.",  value: campaign.conversions,          icon: <Star       sx={{ fontSize: 13 }} /> },
              ].map(m => (
                <Grid item xs={3} key={m.label} sx={{ textAlign: "center" }}>
                  <Box sx={{ color: "#94a3b8", mb: 0.2 }}>{m.icon}</Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{m.value}</Typography>
                  <Typography sx={{ fontSize: 9, color: "#94a3b8" }}>{m.sub || m.label}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* actions */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
            {campaign.recipients?.length || 0} recipient{campaign.recipients?.length !== 1 ? "s" : ""}
            {campaign.sentAt && ` · Sent ${new Date(campaign.sentAt).toLocaleDateString("en-IN")}`}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {campaign.status !== "sent" && (
              <Tooltip title={`Send via ${ti.label} — opens app for each recipient`}>
                <Button size="small" variant="contained"
                  startIcon={<Launch sx={{ fontSize: 12 }} />}
                  onClick={() => onSendClick(campaign)}
                  sx={{ fontSize: 11, fontWeight: 700, textTransform: "none", bgcolor: ti.color, "&:hover": { filter: "brightness(0.9)", bgcolor: ti.color }, borderRadius: 1.5, px: 1.5, py: 0.4, height: 28, minWidth: 0 }}>
                  Send
                </Button>
              </Tooltip>
            )}
            {campaign.status !== "sent" && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(campaign)} sx={{ color: "#0891b2", bgcolor: "#ecfeff", width: 28, height: 28 }}>
                  <Edit sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete permanently">
              <IconButton size="small" onClick={() => onDelete(campaign._id)} sx={{ color: "#dc2626", bgcolor: "#fef2f2", width: 28, height: 28 }}>
                <Delete sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/* CampaignFormDialog  */
const EMPTY = { title: "", type: "email", status: "draft", subject: "", message: "", recipients: "", scheduledAt: "", platform: "", tags: "" };

const CampaignFormDialog = ({ open, onClose, onSave, initial }) => {
  const [form, setForm]           = useState(EMPTY);
  const [imgData, setImgData]     = useState(null);
  const [existing, setExisting]   = useState(null);
  const [removeImg, setRemoveImg] = useState(false);
  const [saving, setSaving]       = useState(false);
  const isEdit = !!initial?._id;

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({ title: initial.title || "", type: initial.type || "email", status: initial.status || "draft", subject: initial.subject || "", message: initial.message || "", recipients: (initial.recipients || []).join(", "), scheduledAt: initial.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0,16) : "", platform: initial.platform || "", tags: (initial.tags || []).join(", ") });
      setExisting(initial.image || null);
    } else { setForm(EMPTY); setExisting(null); }
    setImgData(null); setRemoveImg(false);
  }, [open, initial]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const pMeta = getPlatform(form.platform);

  const rc = () => {
    if (form.type === "email")    return { label: "Recipient Email(s)", placeholder: "alice@example.com, bob@example.com", help: "Clicking Send opens your email client for each address with message pre-filled." };
    if (form.type === "whatsapp") return { label: "WhatsApp Phone Numbers (with country code)", placeholder: "+919876543210, +918765432109", help: "Clicking Send opens WhatsApp for each number with your message pre-typed." };
    if (form.type === "sms")      return { label: "Phone Numbers (with country code)", placeholder: "+919876543210, +918765432109", help: "Clicking Send opens your phone Messages app with number and message." };
    if (form.type === "social" && pMeta) return { label: pMeta.recipientLabel, placeholder: pMeta.recipientPlaceholder, help: pMeta.recipientHelp };
    return { label: "Recipients", placeholder: "", help: "" };
  };
  const rConf = rc();

  const submit = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Title and Message are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, recipients: form.recipients.split(",").map(r => r.trim()).filter(Boolean), tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), scheduledAt: form.scheduledAt || undefined };
      if (imgData?.base64) { payload.imageBase64 = imgData.base64; payload.imageMimeType = imgData.mime; }
      else if (removeImg)  { payload.removeImage = true; }
      if (isEdit) { await axiosAuth().put(`/agent/campaigns/${initial._id}`, payload); toast.success("Campaign updated ✅"); }
      else        { await axiosAuth().post("/agent/campaigns", payload); toast.success("Campaign created 🎉"); }
      onSave(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const previewSrc = imgData?.preview || (!removeImg && existing?.url) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, fontWeight: 700, fontSize: 17 }}>
        {isEdit ? "Edit Campaign" : "New Campaign"}
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField label="Campaign Title *" value={form.title} onChange={f("title")} fullWidth size="small" /></Grid>

          <Grid item xs={6}>
            <TextField label="Type *" value={form.type} onChange={f("type")} fullWidth size="small" select>
              {TYPES.map(t => <MenuItem key={t.value} value={t.value}><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{t.icon} {t.label}</Box></MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField label="Status" value={form.status} onChange={f("status")} fullWidth size="small" select>
              {Object.entries(STATUS_META).map(([v, m]) => <MenuItem key={v} value={v}>{m.label}</MenuItem>)}
            </TextField>
          </Grid>

          {form.type === "email" && (
            <Grid item xs={12}>
              <TextField label="Email Subject" value={form.subject} onChange={f("subject")} fullWidth size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment> }} />
            </Grid>
          )}

          {form.type === "social" && (
            <Grid item xs={12}>
              <TextField label="Platform *" value={form.platform} onChange={f("platform")} fullWidth size="small" select>
                {PLATFORMS.map(p => (
                  <MenuItem key={p.value} value={p.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: p.color }}>{p.icon}<Typography sx={{ fontSize: 13, color: "#0f172a" }}>{p.value}</Typography></Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid item xs={12}><TextField label="Message *" value={form.message} onChange={f("message")} fullWidth size="small" multiline rows={4} /></Grid>

          <Grid item xs={12}>
            <TextField label={rConf.label} value={form.recipients} onChange={f("recipients")} fullWidth size="small" multiline rows={2} placeholder={rConf.placeholder}
              InputProps={{ startAdornment: <InputAdornment position="start"><People sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment> }} />
            {rConf.help && (
              <Alert severity="info" sx={{ mt: 0.8, fontSize: 11, py: 0.3, "& .MuiAlert-message": { py: 0.3 } }}>{rConf.help}</Alert>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#475569", mb: 0.8 }}>Campaign Image (optional · stored on Cloudinary)</Typography>
            <ImageUploader
              value={previewSrc ? { url: previewSrc } : null}
              onChange={d => { setImgData(d); setRemoveImg(false); }}
              onRemove={() => { setImgData(null); setRemoveImg(true); setExisting(null); }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField label="Schedule Date & Time" value={form.scheduledAt} onChange={f("scheduledAt")} fullWidth size="small" type="datetime-local" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Tags (comma-separated)" value={form.tags} onChange={f("tags")} fullWidth size="small" placeholder="launch, q2, doctors"
              InputProps={{ startAdornment: <InputAdornment position="start"><Tag sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment> }} />
          </Grid>
        </Grid>
      </DialogContent>
      <Divider sx={{ mt: 2 }} />
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</Button>
        <Button onClick={submit} variant="contained" size="small" disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Add />}
          sx={{ bgcolor: "#1d4ed8", "&:hover": { bgcolor: "#1e40af" } }}>
          {saving ? "Saving…" : isEdit ? "Update Campaign" : "Create Campaign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── MAIN ──────────────────────────────────────────────────────────────── */
export default function CampaignManagement() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [campaigns, setCampaigns]   = useState([]);
  const [roi, setRoi]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [roiLoading, setRoiLoading] = useState(true);
  const [activeTab, setActiveTab]   = useState("all");
  const [searchQ, setSearchQ]       = useState("");
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [sendTarget, setSendTarget] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try { const { data } = await axiosAuth().get("/agent/campaigns"); setCampaigns(data.campaigns || []); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to load campaigns"); }
    finally { setLoading(false); }
  }, []);

  const fetchROI = useCallback(async () => {
    setRoiLoading(true);
    try { const { data } = await axiosAuth().get("/agent/campaigns/roi"); setRoi(data.roi); }
    catch { /* silent */ } finally { setRoiLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); fetchROI(); }, [fetchCampaigns, fetchROI]);

  const filtered = campaigns.filter(c => {
    const matchTab    = activeTab === "all" || c.type === activeTab;
    const matchSearch = !searchQ || c.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.message?.toLowerCase().includes(searchQ.toLowerCase()) ||
      (c.tags || []).some(t => t.toLowerCase().includes(searchQ.toLowerCase()));
    return matchTab && matchSearch;
  });

  const handleMarkSent = async (id) => {
    try { await axiosAuth().post(`/agent/campaigns/${id}/send`); toast.success("Marked as Sent ✅"); fetchCampaigns(); fetchROI(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await axiosAuth().delete(`/agent/campaigns/${deleteId}`); toast.success("Deleted permanently"); setDeleteId(null); fetchCampaigns(); fetchROI(); }
    catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
    finally { setDeleting(false); }
  };

  const tabCounts = { all: campaigns.length, email: campaigns.filter(c=>c.type==="email").length, social: campaigns.filter(c=>c.type==="social").length, whatsapp: campaigns.filter(c=>c.type==="whatsapp").length, sms: campaigns.filter(c=>c.type==="sms").length };
  const oR = roi?.totalReach > 0 ? ((roi.totalOpens / roi.totalReach)*100).toFixed(1) : 0;
  const ct = roi?.totalOpens > 0 ? ((roi.totalClicks / roi.totalOpens)*100).toFixed(1) : 0;
  const cv = roi?.totalClicks > 0 ? ((roi.totalConversions / roi.totalClicks)*100).toFixed(1) : 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>

      {/* HEADER */}
      <Box sx={{ display: "flex", alignItems: { sm: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>Campaign Management</Typography>
          <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5 }}>
            Click <strong>Send</strong> on a campaign — it opens the correct app for <strong>each recipient</strong> with your message ready
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={() => { fetchCampaigns(); fetchROI(); }} sx={{ border: "1.5px solid #e2e8f0", color: "#475569", width: 40, height: 40 }}><Refresh fontSize="small" /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditTarget(null); setFormOpen(true); }}
            sx={{ bgcolor: "#1d4ed8", borderRadius: 2, fontWeight: 700, fontSize: 13, textTransform: "none", px: 2.5, "&:hover": { bgcolor: "#1e40af" } }}>
            New Campaign
          </Button>
        </Box>
      </Box>

      {/* ROI */}
      {roiLoading ? <LinearProgress sx={{ mb: 3, borderRadius: 1 }} /> : roi && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}><StatCard label="Total Campaigns" value={roi.total} sub={`${roi.sent} sent`} color="#2563eb" icon={<Campaign />} /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Total Reach" value={roi.totalReach.toLocaleString()} sub={`${oR}% open rate`} color="#7c3aed" icon={<People />} /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Click-Through" value={`${ct}%`} sub={`${roi.totalClicks} clicks`} color="#16a34a" icon={<TouchApp />} /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Conversions" value={roi.totalConversions} sub={`${cv}% rate`} color="#ea580c" icon={<Star />} /></Grid>
        </Grid>
      )}

      {/* FILTERS */}
      <Paper sx={{ borderRadius: 3, border: "1.5px solid #e2e8f0", boxShadow: "none", mb: 2.5, overflow: "hidden" }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <TextField placeholder="Search by title, message or tags…" value={searchQ} onChange={e => setSearchQ(e.target.value)} size="small" fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: "#94a3b8" }} /></InputAdornment>, sx: { borderRadius: 2, fontSize: 13 } }} />
        </Box>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant={isMobile ? "scrollable" : "fullWidth"} scrollButtons="auto"
          sx={{ "& .MuiTab-root": { fontSize: 12, fontWeight: 600, textTransform: "none", minHeight: 44 }, "& .Mui-selected": { color: "#1d4ed8" }, "& .MuiTabs-indicator": { bgcolor: "#1d4ed8" } }}>
          {[{ value: "all", label: "All", count: tabCounts.all }, ...TYPES.map(t => ({ value: t.value, label: t.label, count: tabCounts[t.value] }))].map(tab => (
            <Tab key={tab.value} value={tab.value} label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>{tab.label}
                <Chip label={tab.count} size="small" sx={{ height: 17, fontSize: 10, fontWeight: 700, bgcolor: activeTab === tab.value ? "#dbeafe" : "#f1f5f9", color: activeTab === tab.value ? "#1d4ed8" : "#64748b" }} />
              </Box>
            } />
          ))}
        </Tabs>
      </Paper>

      {/* GRID */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#1d4ed8" }} /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, border: "2px dashed #e2e8f0", borderRadius: 3 }}>
          <Campaign sx={{ fontSize: 52, color: "#cbd5e1", mb: 2 }} />
          <Typography sx={{ fontWeight: 700, color: "#475569", mb: 0.5 }}>{searchQ ? "No campaigns match your search" : "No campaigns yet"}</Typography>
          <Typography sx={{ fontSize: 13, color: "#94a3b8", mb: 3 }}>{searchQ ? "Try different keywords" : "Create your first campaign to get started"}</Typography>
          {!searchQ && <Button variant="contained" startIcon={<Add />} onClick={() => { setEditTarget(null); setFormOpen(true); }} sx={{ bgcolor: "#1d4ed8", borderRadius: 2, textTransform: "none", fontWeight: 700 }}>Create Campaign</Button>}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(c => (
            <Grid item xs={12} sm={6} lg={4} key={c._id}>
              <CampaignCard campaign={c} onEdit={camp => { setEditTarget(camp); setFormOpen(true); }} onDelete={id => setDeleteId(id)} onSendClick={camp => setSendTarget(camp)} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ROI BY TYPE */}
      {roi && Object.keys(roi.byType || {}).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a", mb: 2 }}>Performance by Channel</Typography>
          <Grid container spacing={2}>
            {Object.entries(roi.byType).map(([type, d]) => {
              const ti = getType(type);
              const or = d.reach > 0 ? ((d.opens / d.reach)*100).toFixed(1) : 0;
              return (
                <Grid item xs={12} sm={6} md={3} key={type}>
                  <Card sx={{ borderRadius: 3, border: "1.5px solid #e2e8f0", boxShadow: "none", p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: ti.color + "18", color: ti.color, width: 32, height: 32, borderRadius: 1.5 }}>{ti.icon}</Avatar>
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{ti.label}</Typography>
                    </Box>
                    {[{ label: "Campaigns", value: d.total }, { label: "Reach", value: d.reach }, { label: "Opens", value: `${d.opens} (${or}%)` }, { label: "Conversions", value: d.conversions }].map(row => (
                      <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                        <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{row.label}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{row.value}</Typography>
                      </Box>
                    ))}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* SEND DIALOG */}
      <SendRecipientDialog campaign={sendTarget} open={!!sendTarget} onClose={() => setSendTarget(null)} onMarkSent={handleMarkSent} />

      {/* FORM */}
      <CampaignFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} onSave={() => { fetchCampaigns(); fetchROI(); }} initial={editTarget} />

      {/* DELETE */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 0.5 }}>Delete Campaign?</DialogTitle>
        <DialogContent><Typography sx={{ fontSize: 13, color: "#64748b" }}>Permanently deletes the campaign and removes any uploaded image from Cloudinary. Cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} size="small" sx={{ color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" size="small" disabled={deleting}
            startIcon={deleting ? <CircularProgress size={13} color="inherit" /> : <DeleteForever sx={{ fontSize: 14 }} />}
            sx={{ bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" }, textTransform: "none", fontWeight: 700 }}>
            {deleting ? "Deleting…" : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}