import { Request, Response } from "express";

import dbConfig from "../configs/dbConfig";
import { Category } from "../types/Category";

const getCategories = async (req: Request, res: Response) => {
  try {
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingCategories = dbConfig.db
      .prepare(`SELECT * FROM categories`)
      .all() as Category[];

    res.status(200).json({ message: "", data: existingCategories });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default {
  getCategories,
};
