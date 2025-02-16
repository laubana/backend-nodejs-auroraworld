import { Request, Response } from "express";

import dbConfig from "../configs/dbConfig";
import { User } from "../types/User";

const getUsers = async (req: Request, res: Response) => {
  try {
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingUsers = dbConfig.db
      .prepare(`SELECT * FROM users WHERE id != ?`)
      .all(sessionUserId) as User[];

    res.status(200).json({
      message: "",
      data: existingUsers.map((existingUser) => ({
        ...existingUser,
        password: "",
      })),
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default { getUsers };
