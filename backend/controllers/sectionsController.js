import Section from "../models/Section.js";

/* =====================================================
   CREATE SECTION (AUTO SEQUENCE)
===================================================== */
export const createSection = async (req, res) => {
  try {
    const { title, key, subtitle } = req.body;

    if (!title || !key) {
      return res.status(400).json({
        success: false,
        message: "title and key are required",
      });
    }

    const exists = await Section.findOne({ key });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Section key already exists!",
      });
    }

    const nextOrder = (await Section.countDocuments()) + 1;

    const section = await Section.create({
      title,
      subtitle,
      key,
      order: nextOrder,
    });

    res.json({ success: true, section });
  } catch (err) {
    console.error("createSection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


/* =====================================================
   GET ALL SECTIONS (ORDERED)
===================================================== */
export const getSections = async (req, res) => {
  try {
    // ⭐ SORT BY ORDER (NOT createdAt)
    const sections = await Section.find().sort({ order: 1 });
    res.json({ success: true, sections });
  } catch (err) {
    console.error("getSections error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   UPDATE SECTION (TITLE / SUBTITLE)
===================================================== */
export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle } = req.body;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    if (title !== undefined) section.title = title;
    if (subtitle !== undefined) section.subtitle = subtitle;

    await section.save();

    res.json({ success: true, section });
  } catch (err) {
    console.error("updateSection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   DELETE SECTION (AUTO REORDER AFTER DELETE)
===================================================== */
export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const deletedOrder = section.order;

    await Section.deleteOne({ _id: id });

    // ⭐ FIX ORDER AFTER DELETE
    await Section.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    res.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (err) {
    console.error("deleteSection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   ⭐ REORDER SECTIONS (ADMIN DRAG / UP-DOWN)
===================================================== */
export const reorderSections = async (req, res) => {
  try {
    const { orders } = req.body;
    // orders = [{ id, order }]
if (!orders.every(o => o.id && typeof o.order === "number")) {
  return res.status(400).json({
    success: false,
    message: "Invalid order payload",
  });
}
    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: "orders array is required",
      });
    }

    const bulkOps = orders.map((o) => ({
      updateOne: {
        filter: { _id: o.id },
        update: { order: o.order },
      },
    }));

    await Section.bulkWrite(bulkOps);

    res.json({ success: true });
  } catch (err) {
    console.error("reorderSections error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
