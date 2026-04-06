import Manufacturer from "../models/Manufacturer.js";
import Product from "../models/Product.js";

const buildManufacturerFilter = ({ status = "ALL", search = "" } = {}) => {
  const filter = {};
  const normalizedStatus = String(status || "ALL").trim().toUpperCase();
  const trimmedSearch = String(search || "").trim();

  if (normalizedStatus === "PENDING") {
    filter.applicationStatus = { $in: ["PENDING", "UNDER_REVIEW"] };
  } else if (normalizedStatus === "APPROVED") {
    filter.$or = [
      { applicationStatus: "APPROVED" },
      { accountStatus: "ACTIVE" },
      { isVerified: true },
    ];
  } else if (normalizedStatus === "REJECTED") {
    filter.applicationStatus = "REJECTED";
  } else if (normalizedStatus === "BLOCKED") {
    filter.accountStatus = "BLOCKED";
  } else if (normalizedStatus === "UNDER_REVIEW") {
    filter.$or = [
      { applicationStatus: "UNDER_REVIEW" },
      { documentReviewStatus: "UNDER_REVIEW" },
    ];
  }

  if (trimmedSearch) {
    const regex = new RegExp(trimmedSearch, "i");
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { companyName: regex },
        { officialEmail: regex },
        { username: regex },
        { fullName: regex },
        { authName: regex },
      ],
    });
  }

  return filter;
};

export const getAllManufacturers = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find()
      .find(buildManufacturerFilter(req.query))
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(manufacturers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getPendingManufacturers = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find(
      buildManufacturerFilter({ ...req.query, status: "PENDING" }),
    )
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(manufacturers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const approveManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);

    if (!manufacturer) {
      return res.status(404).json({ message: "Manufacturer not found" });
    }

    manufacturer.isVerified = true;
    manufacturer.applicationStatus = "APPROVED";
    manufacturer.documentReviewStatus = "VERIFIED";
    manufacturer.accountStatus = "ACTIVE";
    await manufacturer.save();

    res.json({ message: "Manufacturer approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateManufacturerStatus = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);

    if (!manufacturer) {
      return res.status(404).json({ message: "Manufacturer not found" });
    }

    const {
      applicationStatus,
      documentReviewStatus,
      accountStatus,
      reviewNotes,
      rejectionReason,
    } = req.body || {};

    if (applicationStatus) {
      manufacturer.applicationStatus = applicationStatus;
    }

    if (documentReviewStatus) {
      manufacturer.documentReviewStatus = documentReviewStatus;
    }

    if (accountStatus) {
      manufacturer.accountStatus = accountStatus;
    }

    if (typeof reviewNotes === "string") {
      manufacturer.reviewNotes = reviewNotes.trim();
    }

    if (typeof rejectionReason === "string") {
      manufacturer.rejectionReason = rejectionReason.trim();
    }

    const finalAccountStatus = manufacturer.accountStatus;
    const finalApplicationStatus = manufacturer.applicationStatus;

    if (finalAccountStatus === "ACTIVE") {
      manufacturer.isVerified = true;
      if (finalApplicationStatus !== "REJECTED") {
        manufacturer.applicationStatus = "APPROVED";
      }
      if (manufacturer.documentReviewStatus === "PENDING") {
        manufacturer.documentReviewStatus = "VERIFIED";
      }
    } else if (finalApplicationStatus === "REJECTED") {
      manufacturer.isVerified = false;
      if (manufacturer.documentReviewStatus === "PENDING") {
        manufacturer.documentReviewStatus = "ISSUES_FOUND";
      }
    }

    if (finalAccountStatus === "BLOCKED" && !manufacturer.reviewNotes) {
      manufacturer.reviewNotes = "Blocked by admin";
    }

    await manufacturer.save();

    return res.json({
      success: true,
      message: "Manufacturer status updated successfully",
      manufacturer: {
        ...manufacturer.toObject(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Manufacturer status update error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getManufacturerSummary = async (req, res) => {
  try {
    const [totalManufacturers, pending, underReview, approved, rejected, blocked, listedProducts] =
      await Promise.all([
        Manufacturer.countDocuments(),
        Manufacturer.countDocuments(buildManufacturerFilter({ status: "PENDING" })),
        Manufacturer.countDocuments(buildManufacturerFilter({ status: "UNDER_REVIEW" })),
        Manufacturer.countDocuments(buildManufacturerFilter({ status: "APPROVED" })),
        Manufacturer.countDocuments(buildManufacturerFilter({ status: "REJECTED" })),
        Manufacturer.countDocuments(buildManufacturerFilter({ status: "BLOCKED" })),
        Product.countDocuments({ manufacturerAccountId: { $ne: null } }),
      ]);

    return res.json({
      success: true,
      summary: {
        totalManufacturers,
        pending,
        underReview,
        approved,
        rejected,
        blocked,
        listedProducts,
      },
    });
  } catch (error) {
    console.error("Manufacturer summary error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getManufacturerOwnedProducts = async (req, res) => {
  try {
    const trimmedSearch = String(req.query.search || "").trim();
    const filter = { manufacturerAccountId: { $ne: null } };

    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch, "i");
      filter.$or = [
        { brandName: regex },
        { manufacturer: regex },
        { genericName: regex },
        { genericCompositions: regex },
        { hsn: regex },
      ];
    }

    const products = await Product.find(filter)
      .populate("category", "title")
      .populate("subCategory", "title")
      .populate(
        "manufacturerAccountId",
        "companyName officialEmail username applicationStatus accountStatus documentReviewStatus",
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Manufacturer owned products error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteManufacturer = async (req, res) => {
  try {
    await Manufacturer.findByIdAndDelete(req.params.id);
    res.json({ message: "Manufacturer deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
