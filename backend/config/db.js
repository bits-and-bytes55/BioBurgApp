import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const LEGACY_PRODUCTS_UNIQUE_INDEX =
  "companyBrandName_1_sizeValue_1_sizeUnit_1_packagingType_1_isDeleted_1";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Cleanup old unique index from legacy product schema that blocks new inserts.
    const db = mongoose.connection.db;
    const productsCollectionExists = await db
      .listCollections({ name: "products" }, { nameOnly: true })
      .hasNext();

    if (productsCollectionExists) {
      const productsCollection = db.collection("products");
      const indexes = await productsCollection.indexes();
      const hasLegacyIndex = indexes.some(
        (idx) => idx.name === LEGACY_PRODUCTS_UNIQUE_INDEX
      );

      if (hasLegacyIndex) {
        await productsCollection.dropIndex(LEGACY_PRODUCTS_UNIQUE_INDEX);
        console.log(`Dropped legacy index: ${LEGACY_PRODUCTS_UNIQUE_INDEX}`);
      }
    }
  } catch (err) {
    console.error("DB Connection Failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
