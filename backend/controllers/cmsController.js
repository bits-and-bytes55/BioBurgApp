import CMSPage from "../models/CMSPage.js";

// CREATE PAGE (ADMIN)
export const createPage = async (req, res) => {
  try {
    const { pageName, pageSlug } = req.body;

    if (!pageName || !pageSlug) {
      return res.status(400).json({
        success: false,
        message: "pageName and pageSlug are required",
      });
    }

    // Duplicate check
    const exists = await CMSPage.findOne({ pageSlug });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Page with this slug already exists",
      });
    }

    // Create page with default data
    const page = await CMSPage.create({
      pageName,
      pageSlug,
      status: "draft",
      seo: {
        metaTitle: pageName,
        metaDescription: "",
      },
      sections: [
        {
          sectionKey: "hero",
          heading: pageName,
          content: "",
          order: 1,
          isActive: true,
        },
      ],
      versions: [],
    });

    res.status(201).json({
      success: true,
      page,
    });
  } catch (error) {
    console.error("Create Page Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create page",
    });
  }
};

// LIST ALL PAGES (ADMIN)
export const getAllPages = async (req, res) => {
  const pages = await CMSPage.find().select("pageName pageSlug status updatedAt");
  res.json({ success: true, pages });
};

// GET PAGE (ADMIN + PUBLIC)
export const getPageBySlug = async (req, res) => {
  const page = await CMSPage.findOne({ pageSlug: req.params.slug });
  if (!page) return res.status(404).json({ success: false });

  // Public users should see only published pages
  if (!req.headers.authorization && page.status !== "published") {
    return res.status(403).json({ success: false });
  }

  res.json({ success: true, page });
};

// SAVE PAGE (DRAFT AUTO)
export const savePage = async (req, res) => {
  const page = await CMSPage.findOne({ pageSlug: req.params.slug });

  if (!page) return res.status(404).json({ success: false });

  // Save version snapshot
  page.versions.unshift({
    sections: page.sections,
    seo: page.seo,
  });

  page.sections = req.body.sections;
  page.seo = req.body.seo;
  page.status = "draft";

  await page.save();
  res.json({ success: true, page });
};

// PUBLISH PAGE
export const publishPage = async (req, res) => {
  const page = await CMSPage.findOne({ pageSlug: req.params.slug });
  page.status = "published";
  await page.save();

  res.json({ success: true });
};

// ROLLBACK VERSION
export const rollbackVersion = async (req, res) => {
  const { index } = req.body;
  const page = await CMSPage.findOne({ pageSlug: req.params.slug });

  const version = page.versions[index];
  if (!version) return res.status(400).json({ success: false });

  page.sections = version.sections;
  page.seo = version.seo;

  await page.save();
  res.json({ success: true, page });
};


/* ================= ADMIN ================= */

// CREATE
export const createCMS = async (req, res) => {
  const page = await CMSPage.create(req.body);
  res.json({ success: true, page });
};

// UPDATE
export const updateCMS = async (req, res) => {
  const page = await CMSPage.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ success: true, page });
};

// DELETE
export const deleteCMS = async (req, res) => {
  await CMSPage.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// LIST (ADMIN)
export const getAllCMS = async (req, res) => {
  const pages = await CMSPage.find().sort({ createdAt: -1 });
  res.json({ success: true, pages });
};

/* ================= PUBLIC ================= */

// GET BY SECTION KEY (HOME PAGE)
export const getCMSBySection = async (req, res) => {
  const page = await CMSPage.findOne({
    sectionKey: req.params.sectionKey,
    isActive: true,
  });

  res.json({ success: true, page });
};