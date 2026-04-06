import React, { useEffect, useState } from "react";
import api from "./doctorApi";

const card = {
  background: "#ffffff",
  borderRadius: 16,
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  border: "1px solid #e2e8f0",
};

const demoWallet = {
  totalEarnings: 42600,
  availableBalance: 38400,
  withdrawnAmount: 4200,
  transactions: [
    { type: "credit", amount: 800, note: "Consultation — Aanya Sharma", date: new Date().toISOString() },
    { type: "credit", amount: 600, note: "Consultation — Vikram Singh", date: new Date(Date.now() - 86400000).toISOString() },
    { type: "debit", amount: 4200, note: "Withdrawal to bank account", date: new Date(Date.now() - 172800000).toISOString() },
    { type: "credit", amount: 1200, note: "Consultation — Rahul Mehta", date: new Date(Date.now() - 259200000).toISOString() },
    { type: "credit", amount: 800, note: "Consultation — Priya Kapoor", date: new Date(Date.now() - 345600000).toISOString() },
  ],
};

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWallet(); }, []);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/doctor/wallet");
      setWallet(res.data.wallet || demoWallet);
    } catch {
      setWallet(demoWallet);
    } finally { setLoading(false); }
  };

  const addTestCredit = async () => {
    try {
      await api.post("/doctor/wallet/credit", { amount: 800, note: "Test consultation earning" });
      fetchWallet();
    } catch {
      setWallet((prev) => ({
        ...prev,
        totalEarnings: prev.totalEarnings + 800,
        availableBalance: prev.availableBalance + 800,
        transactions: [
          { type: "credit", amount: 800, note: "Test consultation earning", date: new Date().toISOString() },
          ...(prev.transactions || []),
        ],
      }));
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80, color: "#64748b" }}>Loading wallet...</div>
  );
  if (!wallet) return null;

  const utilizationPct = wallet.totalEarnings ? Math.round((wallet.availableBalance / wallet.totalEarnings) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#0f172a", fontSize: 24, fontWeight: 700, margin: 0 }}>Wallet</h1>
        <p style={{ color: "#64748b", fontSize: 13.5, margin: "4px 0 0" }}>Track your earnings and financial transactions</p>
      </div>

      {/* Hero Balance Card */}
      <div
        style={{
          borderRadius: 20,
          padding: "32px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -60, right: 80, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div>
            <p style={{ color: "#93c5fd", fontSize: 13, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Available Balance</p>
            <p style={{ color: "#ffffff", fontSize: 40, fontWeight: 800, margin: "8px 0 4px", lineHeight: 1 }}>
              ₹{wallet.availableBalance?.toLocaleString("en-IN")}
            </p>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
              of ₹{wallet.totalEarnings?.toLocaleString("en-IN")} total earned
            </p>
          </div>
          <button
            onClick={() => alert("Withdrawal feature coming soon!")}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              // border: "none",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Withdraw Funds
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>Balance utilization</span>
            <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 700 }}>{utilizationPct}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 100 }}>
            <div style={{ height: "100%", width: `${utilizationPct}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)", borderRadius: 100, transition: "width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <p style={{ color: "#64748b", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Earned</p>
          <p style={{ color: "#0f172a", fontSize: 24, fontWeight: 800, margin: "6px 0 0" }}>₹{wallet.totalEarnings?.toLocaleString("en-IN")}</p>
        </div>
        <div style={card}>
          <p style={{ color: "#64748b", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Available</p>
          <p style={{ color: "#16a34a", fontSize: 24, fontWeight: 800, margin: "6px 0 0" }}>₹{wallet.availableBalance?.toLocaleString("en-IN")}</p>
        </div>
        <div style={card}>
          <p style={{ color: "#64748b", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Withdrawn</p>
          <p style={{ color: "#7c3aed", fontSize: 24, fontWeight: 800, margin: "6px 0 0" }}>₹{(wallet.withdrawnAmount || 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Transactions */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: 0 }}>Transaction History</h3>
          <button
            onClick={addTestCredit}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            + Add Test Credit
          </button>
        </div>

        {(!wallet.transactions || wallet.transactions.length === 0) ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {wallet.transactions.map((t, i) => {
              const isCredit = t.type === "credit";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 12px",
                    borderRadius: 10,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: isCredit ? "#dcfce7" : "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isCredit ? "#16a34a" : "#dc2626"} strokeWidth="2.5">
                      {isCredit
                        ? <path d="M12 19V5M5 12l7-7 7 7" />
                        : <path d="M12 5v14M5 12l7 7 7-7" />}
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#0f172a", fontSize: 14, fontWeight: 600, margin: 0 }}>{t.note}</p>
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: "3px 0 0" }}>
                      {t.date ? new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: isCredit ? "#16a34a" : "#dc2626", margin: 0 }}>
                    {isCredit ? "+" : "−"}₹{t.amount?.toLocaleString("en-IN")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
