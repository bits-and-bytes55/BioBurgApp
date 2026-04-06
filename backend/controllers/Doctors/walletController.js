import Doctor from "../../models/doctors/Doctor.js";

/* ===== GET WALLET ===== */
export const getWallet = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id).select("wallet");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Initialize wallet if missing
    if (!doctor.wallet) {
      doctor.wallet = { totalEarnings: 0, availableBalance: 0, transactions: [] };
      await doctor.save();
    }

    res.json({
      success: true,
      wallet: {
        totalEarnings: doctor.wallet.totalEarnings || 0,
        availableBalance: doctor.wallet.availableBalance || 0,
        withdrawnAmount:
          (doctor.wallet.totalEarnings || 0) - (doctor.wallet.availableBalance || 0),
        transactions: (doctor.wallet.transactions || []).slice().reverse(), // newest first
      },
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ message: "Failed to fetch wallet" });
  }
};

/* ===== ADD CREDIT (testing / admin trigger) ===== */
export const addWalletCredit = async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.wallet = doctor.wallet || { totalEarnings: 0, availableBalance: 0, transactions: [] };
    doctor.wallet.totalEarnings += amount;
    doctor.wallet.availableBalance += amount;
    doctor.wallet.transactions.push({
      type: "credit",
      amount,
      note: note || "Manual credit",
      date: new Date(),
    });
    await doctor.save();

    res.json({
      success: true,
      message: `₹${amount} credited to wallet`,
      wallet: {
        totalEarnings: doctor.wallet.totalEarnings,
        availableBalance: doctor.wallet.availableBalance,
      },
    });
  } catch (error) {
    console.error("Add wallet credit error:", error);
    res.status(500).json({ message: "Failed to add credit" });
  }
};

/* ===== WITHDRAW (debit) ===== */
export const withdrawWallet = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const available = doctor.wallet?.availableBalance || 0;
    if (!amount || amount <= 0 || amount > available) {
      return res.status(400).json({
        message: `Invalid amount. Available balance: ₹${available}`,
      });
    }

    doctor.wallet.availableBalance -= amount;
    doctor.wallet.transactions.push({
      type: "debit",
      amount,
      note: note || "Withdrawal to bank account",
      date: new Date(),
    });
    await doctor.save();

    res.json({
      success: true,
      message: `₹${amount} withdrawn successfully`,
      wallet: {
        totalEarnings: doctor.wallet.totalEarnings,
        availableBalance: doctor.wallet.availableBalance,
      },
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ message: "Failed to process withdrawal" });
  }
};