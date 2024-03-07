import connectDb from "./db/index.js";
import { app } from "./app.js";

// Connects to the server and starts listening for connections.
connectDb()
  .then(() => {
    // app.on("error", (error) => {
    //   console.error("App connection failed:", error);
    //   process.exit(1);
    // });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Sever is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Mongo db connection failed:", error);
  });
//----------------------------------------------------------------------