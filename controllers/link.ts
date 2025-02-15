import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import dbConfig from "../configs/dbConfig";
import { Link } from "../types/Link";

const addLink = async (req: Request, res: Response) => {
  try {
    const { category, name, url } = req.body;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!category || !name || !url) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `INSERT INTO links (id, user_id, created_by, category, name, url) SELECT ?, ?, ?, ?, ?, ? FROM users WHERE id = ?`
    );

    let linkId;

    while (true) {
      try {
        linkId = uuidv4().replace(/-/g, "");

        stmt.run(
          linkId,
          sessionUserId,
          sessionUserEmail,
          category,
          name,
          url,
          sessionUserId
        );

        break;
      } catch (error) {
        console.error(error);

        if (
          (error as Error).message.includes(
            "UNIQUE constraint failed: links.id"
          )
        ) {
          continue;
        } else {
          throw error;
        }
      }
    }

    const newLink = dbConfig.db
      .prepare(`SELECT * FROM links WHERE id = ?`)
      .get(linkId) as Link;

    if (newLink) {
      res
        .status(201)
        .json({ message: "Link created successfully.", data: newLink });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const getOwnLinks = async (req: Request, res: Response) => {
  try {
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingLinks = dbConfig.db
      .prepare(`SELECT * FROM links WHERE user_id = ?`)
      .all(sessionUserId) as Link[];

    res.status(200).json({ message: "", data: existingLinks });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const getSharedLinks = async (req: Request, res: Response) => {
  try {
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingLinks = dbConfig.db
      .prepare(
        `SELECT links.* FROM links WHERE id IN (SELECT link_id FROM shares WHERE user_id = ?)`
      )
      .all(sessionUserId) as Link[];

    res.status(201).json({ message: "", data: existingLinks });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const removeLink = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!linkId) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `DELETE FROM links WHERE id = ? AND user_id = ?`
    );

    const result = stmt.run(linkId, sessionUserId);

    if (result.changes === 1) {
      res.status(201).json({ message: "Link removed successfully." });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default { addLink, getOwnLinks, getSharedLinks, removeLink };
