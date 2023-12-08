import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is listening on : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection Failed !!!", err);
    process.exit(1);
  });
