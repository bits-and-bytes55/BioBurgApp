import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import BulkManufacturingAccount from "../models/BulkManufacturingAccount.js";
import BulkManufacturingRequirement from "../models/BulkManufacturingRequirement.js";
import BulkManufacturingRequest from "../models/BulkManufacturingRequest.js";
import Order from "../models/Order.js";

const REQUEST_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
const DOCUMENT_REVIEW_STATUSES = ["PENDING", "VERIFIED", "ISSUES_FOUND"];
const REQUIREMENT_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "QUOTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

const BULK_ORDER_OPEN_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
];

const REQUIRED_DOCUMENT_KEYS = [
  "importLicenseFile",
  "gdpCert",
  "buyerLetter",
  "companyRegCert",
  "passportCopy",
  "companyProfile",
];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasEmailConfig = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const normalizeDocumentsInput = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object" ? value : {};
};

const getUploadedFileUrl = (files, key) =>
  String(files?.[key]?.[0]?.path || files?.[key]?.[0]?.secure_url || "").trim();

const buildDocuments = (payload = {}, files = {}) => ({
  importLicenseFile: payload.importLicenseFile || getUploadedFileUrl(files, "importLicenseFile") || "",
  gdpCert: payload.gdpCert || getUploadedFileUrl(files, "gdpCert") || "",
  buyerLetter: payload.buyerLetter || getUploadedFileUrl(files, "buyerLetter") || "",
  proofOfFunds: payload.proofOfFunds || getUploadedFileUrl(files, "proofOfFunds") || "",
  companyRegCert: payload.companyRegCert || getUploadedFileUrl(files, "companyRegCert") || "",
  passportCopy: payload.passportCopy || getUploadedFileUrl(files, "passportCopy") || "",
  companyProfile: payload.companyProfile || getUploadedFileUrl(files, "companyProfile") || "",
});

const pushStatusHistory = (request, status, note, actor = "Admin") => {
  request.statusHistory = request.statusHistory || [];
  request.statusHistory.push({
    status,
    note: note || "",
    actor,
    changedAt: new Date(),
  });
};

const pushRequirementStatusHistory = (
  requirement,
  status,
  note,
  actor = "Admin",
) => {
  requirement.statusHistory = requirement.statusHistory || [];
  requirement.statusHistory.push({
    status,
    note: note || "",
    actor,
    changedAt: new Date(),
  });
};

const buildDocumentSummary = (request) => {
  const documents = request?.documents || {};
  const uploadedKeys = Object.entries(documents)
    .filter(([, value]) => Boolean(String(value || "").trim()))
    .map(([key]) => key);

  return {
    uploadedCount: uploadedKeys.length,
    uploadedKeys,
    missingRequiredDocuments: REQUIRED_DOCUMENT_KEYS.filter(
      (key) => !uploadedKeys.includes(key),
    ),
  };
};

const normalizeUsername = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const createTemporaryPassword = () =>
  `BioBulk@${Math.random().toString(36).slice(2, 6)}${Date.now()
    .toString()
    .slice(-4)}`;

const sendBulkPortalCredentialsEmail = async ({
  email,
  username,
  password,
  companyName,
}) => {
  if (!hasEmailConfig()) {
    return false;
  }

  await transporter.sendMail({
    from: `"BioBurg Bulk Manufacturing" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your BioBurg Bulk Manufacturing Portal Credentials",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px">
        <h2 style="margin:0 0 12px;color:#0f766e">Portal Access Ready</h2>
        <p style="margin:0 0 16px;color:#334155">Your bulk manufacturing partner application has been approved${companyName ? ` for <strong>${companyName}</strong>` : ""}.</p>
        <div style="padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0">
          <p style="margin:0 0 8px;color:#475569"><strong>Username:</strong> ${username}</p>
          <p style="margin:0 0 8px;color:#475569"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;color:#475569"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p style="margin:16px 0 0;color:#64748b">Please sign in and change your password as soon as possible.</p>
      </div>
    `,
  });

  return true;
};

const ensureUniqueUsername = async (requestedUsername, email) => {
  const emailBase = String(email || "").split("@")[0];
  const base =
    normalizeUsername(requestedUsername) ||
    normalizeUsername(emailBase) ||
    `biobulk-${Date.now()}`;

  let candidate = base;
  let attempt = 0;

  while (true) {
    const existing = await BulkManufacturingAccount.findOne({
      username: candidate,
    }).select("_id");

    if (!existing) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
};

const createOrSyncAccountForRequest = async (request, actor = "Admin") => {
  let account = null;

  if (request.accountId) {
    account = await BulkManufacturingAccount.findById(request.accountId);
  }

  if (!account) {
    account = await BulkManufacturingAccount.findOne({
      requestId: request._id,
    });
  }

  if (!account && request.email) {
    account = await BulkManufacturingAccount.findOne({
      email: String(request.email).trim().toLowerCase(),
    });

    if (account && String(account.requestId) !== String(request._id)) {
      throw new Error("This email is already linked to another bulk account.");
    }
  }

  let generatedPassword = "";
  let accountCreated = false;

  if (!account) {
    const username = await ensureUniqueUsername(
      request.requestedUsername,
      request.email,
    );
    generatedPassword = createTemporaryPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    account = await BulkManufacturingAccount.create({
      requestId: request._id,
      username,
      email: String(request.email || "").trim().toLowerCase(),
      password: hashedPassword,
      companyName: request.companyName || "",
      contactName: request.fullName || "",
      designation: request.designation || "",
      mobile: request.mobile || "",
      whatsapp: request.whatsapp || "",
      country: request.country || "",
      website: request.website || "",
      status: "ACTIVE",
    });

    accountCreated = true;
  } else {
    account.email = String(request.email || account.email || "")
      .trim()
      .toLowerCase();
    account.companyName = request.companyName || account.companyName || "";
    account.contactName = request.fullName || account.contactName || "";
    account.designation = request.designation || account.designation || "";
    account.mobile = request.mobile || account.mobile || "";
    account.whatsapp = request.whatsapp || account.whatsapp || "";
    account.country = request.country || account.country || "";
    account.website = request.website || account.website || "";

    if (account.status === "INACTIVE") {
      account.status = "ACTIVE";
    }

    await account.save();
  }

  request.accountId = account._id;
  request.approvedAt = new Date();
  request.approvedBy = actor;

  return {
    account,
    accountCreated,
    generatedPassword,
  };
};

const buildSearchFilter = (search) => {
  if (!search) {
    return null;
  }

  const regex = new RegExp(escapeRegex(String(search).trim()), "i");

  return {
    $or: [
      { fullName: regex },
      { email: regex },
      { mobile: regex },
      { companyName: regex },
      { country: regex },
      { products: regex },
      { requestedUsername: regex },
    ],
  };
};

const buildBulkOrderSearchFilter = (search) => {
  if (!search) {
    return null;
  }

  const regex = new RegExp(escapeRegex(String(search).trim()), "i");

  return {
    $or: [
      { orderId: regex },
      { invoiceNumber: regex },
      { "address.fullName": regex },
      { "address.phone": regex },
      { "address.city": regex },
      { "address.state": regex },
      { "items.name": regex },
      { "items.manufacturer": regex },
      { "items.genericName": regex },
    ],
  };
};

export const createBulkManufacturingRequest = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      companyName,
      country,
      orgType,
      products,
      quantity,
      destinationCountry,
      purpose,
      paymentMethod,
      documents = {},
      username,
      ...rest
    } = req.body;

    if (
      !fullName ||
      !mobile ||
      !email ||
      !companyName ||
      !country ||
      !orgType ||
      !products ||
      !quantity ||
      !destinationCountry ||
      !purpose ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message:
          "Please fill all required bulk manufacturing registration fields.",
      });
    }

    const normalizedDocuments = buildDocuments(
      normalizeDocumentsInput(documents),
      req.files,
    );

    const request = await BulkManufacturingRequest.create({
      fullName,
      mobile,
      email,
      companyName,
      country,
      orgType,
      products,
      quantity,
      destinationCountry,
      purpose,
      paymentMethod,
      requestedUsername: username || "",
      documents: normalizedDocuments,
      ...rest,
    });

    return res.status(201).json({
      message:
        "Bulk manufacturing request submitted successfully. Our team will review it shortly.",
      requestId: request._id,
    });
  } catch (error) {
    console.error("Bulk manufacturing request create error:", error);
    return res.status(500).json({
      message: "Unable to submit bulk manufacturing request right now.",
    });
  }
};

export const getAdminBulkManufacturingOverview = async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      underReviewRequests,
      approvedRequests,
      rejectedRequests,
      verifiedDocuments,
      issueDocuments,
      totalAccounts,
      activeAccounts,
      blockedAccounts,
      totalRequirements,
      openRequirements,
      quotedRequirements,
      totalWebsiteOrders,
      openWebsiteOrders,
      deliveredWebsiteOrders,
      totalOrderRevenue,
      recentRequests,
      recentRequirements,
      recentOrders,
    ] = await Promise.all([
      BulkManufacturingRequest.countDocuments(),
      BulkManufacturingRequest.countDocuments({ status: "PENDING" }),
      BulkManufacturingRequest.countDocuments({ status: "UNDER_REVIEW" }),
      BulkManufacturingRequest.countDocuments({ status: "APPROVED" }),
      BulkManufacturingRequest.countDocuments({ status: "REJECTED" }),
      BulkManufacturingRequest.countDocuments({
        documentReviewStatus: "VERIFIED",
      }),
      BulkManufacturingRequest.countDocuments({
        documentReviewStatus: "ISSUES_FOUND",
      }),
      BulkManufacturingAccount.countDocuments(),
      BulkManufacturingAccount.countDocuments({ status: "ACTIVE" }),
      BulkManufacturingAccount.countDocuments({ status: "BLOCKED" }),
      BulkManufacturingRequirement.countDocuments(),
      BulkManufacturingRequirement.countDocuments({
        status: { $in: ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED"] },
      }),
      BulkManufacturingRequirement.countDocuments({ status: "QUOTED" }),
      Order.countDocuments({
        fulfilmentOwnerType: "BULK_MANUFACTURING",
        bulkManufacturingAccountId: { $ne: null },
      }),
      Order.countDocuments({
        fulfilmentOwnerType: "BULK_MANUFACTURING",
        bulkManufacturingAccountId: { $ne: null },
        orderStatus: { $in: BULK_ORDER_OPEN_STATUSES },
      }),
      Order.countDocuments({
        fulfilmentOwnerType: "BULK_MANUFACTURING",
        bulkManufacturingAccountId: { $ne: null },
        orderStatus: "DELIVERED",
      }),
      Order.aggregate([
        {
          $match: {
            fulfilmentOwnerType: "BULK_MANUFACTURING",
            bulkManufacturingAccountId: { $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          },
        },
      ]),
      BulkManufacturingRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "fullName companyName email status documentReviewStatus createdAt",
        )
        .lean(),
      BulkManufacturingRequirement.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("accountId", "companyName username email")
        .select("productName quantity status priority createdAt")
        .lean(),
      Order.find({
        fulfilmentOwnerType: "BULK_MANUFACTURING",
        bulkManufacturingAccountId: { $ne: null },
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate(
          "bulkManufacturingAccountId",
          "companyName username email status",
        )
        .populate("userId", "name email phone")
        .select(
          "orderId invoiceNumber totalAmount paymentMode paymentStatus orderStatus createdAt items address bulkManufacturingAccountId fulfilmentOwnerType",
        )
        .lean(),
    ]);

    const orderRevenue = Number(totalOrderRevenue?.[0]?.totalRevenue || 0);

    return res.status(200).json({
      summary: {
        totalRequests,
        pendingRequests,
        underReviewRequests,
        approvedRequests,
        rejectedRequests,
        verifiedDocuments,
        issueDocuments,
        totalAccounts,
        activeAccounts,
        blockedAccounts,
        totalRequirements,
        openRequirements,
        quotedRequirements,
        totalWebsiteOrders,
        openWebsiteOrders,
        deliveredWebsiteOrders,
        totalOrderRevenue: orderRevenue,
      },
      recentRequests,
      recentRequirements,
      recentOrders,
    });
  } catch (error) {
    console.error("Admin bulk manufacturing overview error:", error);
    return res.status(500).json({
      message: "Unable to load bulk manufacturing overview.",
    });
  }
};

export const getAdminBulkManufacturingRequests = async (req, res) => {
  try {
    const {
      status = "",
      search = "",
      documentReviewStatus = "",
    } = req.query;
    const filter = {};

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (
      documentReviewStatus &&
      documentReviewStatus !== "ALL" &&
      DOCUMENT_REVIEW_STATUSES.includes(documentReviewStatus)
    ) {
      filter.documentReviewStatus = documentReviewStatus;
    }

    const searchFilter = buildSearchFilter(search);
    if (searchFilter) {
      Object.assign(filter, searchFilter);
    }

    const requests = await BulkManufacturingRequest.find(filter)
      .populate("accountId", "username email status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const rows = requests.map((request) => ({
      ...request,
      documentSummary: buildDocumentSummary(request),
    }));

    const summary = {
      total: await BulkManufacturingRequest.countDocuments(),
      pending: await BulkManufacturingRequest.countDocuments({
        status: "PENDING",
      }),
      underReview: await BulkManufacturingRequest.countDocuments({
        status: "UNDER_REVIEW",
      }),
      approved: await BulkManufacturingRequest.countDocuments({
        status: "APPROVED",
      }),
      rejected: await BulkManufacturingRequest.countDocuments({
        status: "REJECTED",
      }),
      documentsVerified: await BulkManufacturingRequest.countDocuments({
        documentReviewStatus: "VERIFIED",
      }),
      documentsIssues: await BulkManufacturingRequest.countDocuments({
        documentReviewStatus: "ISSUES_FOUND",
      }),
    };

    return res.status(200).json({ requests: rows, summary });
  } catch (error) {
    console.error("Admin bulk manufacturing requests fetch error:", error);
    return res.status(500).json({
      message: "Unable to fetch bulk manufacturing requests.",
    });
  }
};

export const getAdminBulkManufacturingRequestById = async (req, res) => {
  try {
    const request = await BulkManufacturingRequest.findById(req.params.id)
      .populate("accountId", "username email status createdAt lastLoginAt")
      .lean();

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const requirements = await BulkManufacturingRequirement.find({
      requestId: request._id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      request: {
        ...request,
        documentSummary: buildDocumentSummary(request),
      },
      requirements,
    });
  } catch (error) {
    console.error("Admin bulk manufacturing request detail error:", error);
    return res.status(500).json({
      message: "Unable to fetch bulk manufacturing request details.",
    });
  }
};

export const updateAdminBulkManufacturingRequestStatus = async (req, res) => {
  try {
    const {
      status,
      reviewNotes = "",
      rejectionReason = "",
      documentReviewStatus = "",
      documentReviewNotes = "",
    } = req.body;

    if (!REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    if (
      documentReviewStatus &&
      !DOCUMENT_REVIEW_STATUSES.includes(documentReviewStatus)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid document review status." });
    }

    const request = await BulkManufacturingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    request.status = status;
    request.reviewNotes = reviewNotes;
    request.rejectionReason = status === "REJECTED" ? rejectionReason : "";

    if (documentReviewStatus) {
      request.documentReviewStatus = documentReviewStatus;
    }

    if (typeof documentReviewNotes === "string") {
      request.documentReviewNotes = documentReviewNotes;
    }

    const actor = req.admin?.email || "Admin";
    pushStatusHistory(
      request,
      status,
      reviewNotes || rejectionReason || documentReviewNotes,
      actor,
    );

    let provisionedAccount = null;
    let credentialsEmailSent = false;

    if (status === "APPROVED") {
      provisionedAccount = await createOrSyncAccountForRequest(request, actor);
      if (
        provisionedAccount?.accountCreated &&
        provisionedAccount.generatedPassword
      ) {
        credentialsEmailSent = await sendBulkPortalCredentialsEmail({
          email: provisionedAccount.account.email,
          username: provisionedAccount.account.username,
          password: provisionedAccount.generatedPassword,
          companyName: provisionedAccount.account.companyName,
        }).catch((error) => {
          console.error(
            "Bulk manufacturing approval credentials email error:",
            error,
          );
          return false;
        });
      }
    }

    if (status === "REJECTED" && request.accountId) {
      await BulkManufacturingAccount.findByIdAndUpdate(request.accountId, {
        status: "BLOCKED",
      });
    }

    await request.save();

    return res.status(200).json({
      message: "Bulk manufacturing request updated successfully.",
      request,
      emailDelivery: {
        credentialsEmailSent,
      },
      credentials:
        provisionedAccount?.accountCreated && provisionedAccount.generatedPassword
          ? {
              username: provisionedAccount.account.username,
              email: provisionedAccount.account.email,
              password: provisionedAccount.generatedPassword,
            }
          : null,
    });
  } catch (error) {
    console.error("Admin bulk manufacturing request status update error:", error);
    return res.status(500).json({
      message:
        error.message || "Unable to update bulk manufacturing request.",
    });
  }
};

export const getAdminBulkManufacturingAccounts = async (req, res) => {
  try {
    const { status = "", search = "" } = req.query;
    const filter = {};

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(String(search).trim()), "i");
      filter.$or = [
        { username: regex },
        { email: regex },
        { companyName: regex },
        { contactName: regex },
      ];
    }

    const accounts = await BulkManufacturingAccount.find(filter)
      .populate(
        "requestId",
        "status documentReviewStatus companyName fullName products quantity createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    const summary = {
      total: await BulkManufacturingAccount.countDocuments(),
      active: await BulkManufacturingAccount.countDocuments({ status: "ACTIVE" }),
      inactive: await BulkManufacturingAccount.countDocuments({
        status: "INACTIVE",
      }),
      blocked: await BulkManufacturingAccount.countDocuments({
        status: "BLOCKED",
      }),
    };

    return res.status(200).json({ accounts, summary });
  } catch (error) {
    console.error("Admin bulk manufacturing accounts fetch error:", error);
    return res.status(500).json({
      message: "Unable to fetch bulk manufacturing accounts.",
    });
  }
};

export const updateAdminBulkManufacturingAccountStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({ message: "Invalid account status." });
    }

    const account = await BulkManufacturingAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    account.status = status;
    await account.save();

    return res.status(200).json({
      message: "Account status updated successfully.",
      account,
    });
  } catch (error) {
    console.error("Admin bulk manufacturing account status update error:", error);
    return res.status(500).json({
      message: "Unable to update account status.",
    });
  }
};

export const resetAdminBulkManufacturingAccountPassword = async (req, res) => {
  try {
    const account = await BulkManufacturingAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    const generatedPassword = createTemporaryPassword();
    account.password = await bcrypt.hash(generatedPassword, 10);
    await account.save();

    const credentialsEmailSent = await sendBulkPortalCredentialsEmail({
      email: account.email,
      username: account.username,
      password: generatedPassword,
      companyName: account.companyName,
    }).catch((error) => {
      console.error("Bulk manufacturing reset credentials email error:", error);
      return false;
    });

    return res.status(200).json({
      message: "Temporary password generated successfully.",
      emailDelivery: {
        credentialsEmailSent,
      },
      credentials: {
        username: account.username,
        email: account.email,
        password: generatedPassword,
      },
    });
  } catch (error) {
    console.error("Admin bulk manufacturing password reset error:", error);
    return res.status(500).json({
      message: "Unable to reset account password.",
    });
  }
};

export const getAdminBulkManufacturingOrders = async (req, res) => {
  try {
    const {
      status = "",
      paymentMode = "",
      paymentStatus = "",
      accountId = "",
      search = "",
      from = "",
      to = "",
    } = req.query;

    const filter = {
      fulfilmentOwnerType: "BULK_MANUFACTURING",
      bulkManufacturingAccountId: { $ne: null },
    };

    if (status && status !== "ALL") {
      filter.orderStatus = status;
    }

    if (paymentMode && paymentMode !== "ALL") {
      filter.paymentMode = paymentMode;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      filter.paymentStatus = paymentStatus;
    }

    if (accountId && accountId !== "ALL") {
      filter.bulkManufacturingAccountId = accountId;
    }

    if (from && to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $gte: new Date(from),
        $lte: endDate,
      };
    }

    const searchFilter = buildBulkOrderSearchFilter(search);
    const queryFilter = searchFilter ? { ...filter, ...searchFilter } : filter;

    const [orders, accounts] = await Promise.all([
      Order.find(queryFilter)
        .sort({ createdAt: -1 })
        .populate(
          "bulkManufacturingAccountId",
          "companyName username email status",
        )
        .populate("userId", "name email phone")
        .select(
          "orderId invoiceNumber totalAmount paymentMode paymentStatus orderStatus createdAt items address trackingHistory bulkManufacturingAccountId fulfilmentOwnerType invoiceReady deliveredAt",
        )
        .lean(),
      BulkManufacturingAccount.find()
        .select("companyName username email status")
        .sort({ companyName: 1, createdAt: -1 })
        .lean(),
    ]);

    const summary = orders.reduce(
      (accumulator, order) => {
        accumulator.totalOrders += 1;
        accumulator.totalRevenue += Number(order.totalAmount || 0);
        accumulator.totalUnits += (order.items || []).reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        );

        if (BULK_ORDER_OPEN_STATUSES.includes(order.orderStatus)) {
          accumulator.openOrders += 1;
        }

        if (order.orderStatus === "DELIVERED") {
          accumulator.deliveredOrders += 1;
        }

        if (order.orderStatus === "CANCELLED") {
          accumulator.cancelledOrders += 1;
        }

        if (order.paymentStatus === "PAID") {
          accumulator.paidOrders += 1;
        }

        if (order.invoiceReady) {
          accumulator.invoiceReadyOrders += 1;
        }

        accumulator.partnerSet.add(
          String(order.bulkManufacturingAccountId?._id || ""),
        );

        return accumulator;
      },
      {
        totalOrders: 0,
        openOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        paidOrders: 0,
        invoiceReadyOrders: 0,
        totalRevenue: 0,
        totalUnits: 0,
        partnerSet: new Set(),
      },
    );

    const activePartners = summary.partnerSet.has("")
      ? summary.partnerSet.size - 1
      : summary.partnerSet.size;
    delete summary.partnerSet;
    summary.activePartners = activePartners;
    summary.averageOrderValue = summary.totalOrders
      ? Number((summary.totalRevenue / summary.totalOrders).toFixed(2))
      : 0;

    return res.status(200).json({
      orders,
      summary,
      accounts,
    });
  } catch (error) {
    console.error("Admin bulk manufacturing orders fetch error:", error);
    return res.status(500).json({
      message: "Unable to fetch bulk manufacturing orders.",
    });
  }
};

export const getAdminBulkManufacturingRequirements = async (req, res) => {
  try {
    const { status = "", search = "" } = req.query;
    const filter = {};

    if (status && status !== "ALL") {
      filter.status = status;
    }

    const requirements = await BulkManufacturingRequirement.find(filter)
      .populate("accountId", "companyName username email status")
      .populate("requestId", "fullName companyName country")
      .sort({ createdAt: -1 })
      .lean();

    const filteredRequirements = search
      ? requirements.filter((requirement) => {
          const haystack = [
            requirement.productName,
            requirement.quantity,
            requirement.targetCountry,
            requirement.accountId?.companyName,
            requirement.accountId?.username,
            requirement.accountId?.email,
            requirement.requestId?.fullName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(String(search).trim().toLowerCase());
        })
      : requirements;

    const summary = {
      total: await BulkManufacturingRequirement.countDocuments(),
      submitted: await BulkManufacturingRequirement.countDocuments({
        status: "SUBMITTED",
      }),
      underReview: await BulkManufacturingRequirement.countDocuments({
        status: "UNDER_REVIEW",
      }),
      quoted: await BulkManufacturingRequirement.countDocuments({
        status: "QUOTED",
      }),
      approved: await BulkManufacturingRequirement.countDocuments({
        status: "APPROVED",
      }),
      closed: await BulkManufacturingRequirement.countDocuments({
        status: "CLOSED",
      }),
    };

    return res.status(200).json({
      requirements: filteredRequirements,
      summary,
    });
  } catch (error) {
    console.error("Admin bulk manufacturing requirements fetch error:", error);
    return res.status(500).json({
      message: "Unable to fetch bulk manufacturing requirements.",
    });
  }
};

export const updateAdminBulkManufacturingRequirement = async (req, res) => {
  try {
    const {
      status = "",
      adminNotes = "",
      quote = {},
    } = req.body;

    const requirement = await BulkManufacturingRequirement.findById(
      req.params.id,
    );

    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found." });
    }

    if (status) {
      if (!REQUIREMENT_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid requirement status." });
      }

      requirement.status = status;
      pushRequirementStatusHistory(
        requirement,
        status,
        adminNotes || quote.quoteNotes || "",
        req.admin?.email || "Admin",
      );
    }

    if (typeof adminNotes === "string") {
      requirement.adminNotes = adminNotes;
    }

    if (quote && typeof quote === "object") {
      requirement.quote = {
        ...requirement.quote,
        ...quote,
        updatedAt: new Date(),
      };
    }

    await requirement.save();

    return res.status(200).json({
      message: "Requirement updated successfully.",
      requirement,
    });
  } catch (error) {
    console.error("Admin bulk manufacturing requirement update error:", error);
    return res.status(500).json({
      message: "Unable to update requirement.",
    });
  }
};

export const getAdminBulkManufacturingDocumentsQueue = async (req, res) => {
  try {
    const { search = "", documentReviewStatus = "" } = req.query;
    const filter = {};

    if (
      documentReviewStatus &&
      documentReviewStatus !== "ALL" &&
      DOCUMENT_REVIEW_STATUSES.includes(documentReviewStatus)
    ) {
      filter.documentReviewStatus = documentReviewStatus;
    }

    const searchFilter = buildSearchFilter(search);
    if (searchFilter) {
      Object.assign(filter, searchFilter);
    }

    const requests = await BulkManufacturingRequest.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "fullName companyName email status documentReviewStatus documentReviewNotes documents createdAt",
      )
      .lean();

    const rows = requests.map((request) => ({
      ...request,
      documentSummary: buildDocumentSummary(request),
    }));

    const summary = {
      total: rows.length,
      verified: rows.filter(
        (item) => item.documentReviewStatus === "VERIFIED",
      ).length,
      issues: rows.filter(
        (item) => item.documentReviewStatus === "ISSUES_FOUND",
      ).length,
      pending: rows.filter(
        (item) => item.documentReviewStatus === "PENDING",
      ).length,
      missingRequired: rows.filter(
        (item) => item.documentSummary.missingRequiredDocuments.length > 0,
      ).length,
    };

    return res.status(200).json({ requests: rows, summary });
  } catch (error) {
    console.error("Admin bulk manufacturing documents fetch error:", error);
    return res.status(500).json({
      message: "Unable to fetch bulk manufacturing documents queue.",
    });
  }
};
