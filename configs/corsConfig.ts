import cors from "cors";

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      (process.env.ORIGINS || "http://localhost:5173")
        .split(",")
        .includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("CORS Error"));
    }
  },
  credentials: true,
};

export default { corsOptions };
