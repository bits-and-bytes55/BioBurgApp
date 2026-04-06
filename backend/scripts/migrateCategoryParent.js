import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "https://bioburglifescience-1.onrender.com";

async function migrateParentCategory() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const categories = await Category.find({
      parentCategory: { $type: "string" },
    });

    console.log(` Found ${categories.length} categories to migrate`);

    for (const cat of categories) {
      const parentStr = cat.parentCategory;

      if (mongoose.Types.ObjectId.isValid(parentStr)) {
        cat.parentCategory = new mongoose.Types.ObjectId(parentStr);
        await cat.save();

        console.log(
          ` Migrated category ${cat.title} → parentCategory ObjectId`
        );
      } else {
        console.log(
          ` Skipped ${cat.title} (invalid parentCategory: ${parentStr})`
        );
      }
    }

    console.log(" Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error(" Migration failed:", error);
    process.exit(1);
  }
}

migrateParentCategory();
