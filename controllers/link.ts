import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import dbConfig from "../configs/dbConfig";
import { Link } from "../types/Link";

const addLink = async (req: Request, res: Response) => {
  try {
    const { categoryId, name, url } = req.body;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!categoryId || !name || !url) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `INSERT INTO links (id, user_id, created_by, category_id, category_name, name, url) SELECT ?, ?, ?, ?, (SELECT name FROM categories WHERE id = ?), ?, ?`
    );

    let linkId;

    while (true) {
      try {
        linkId = uuidv4().replace(/-/g, "");

        stmt.run(
          linkId,
          sessionUserId,
          sessionUserEmail,
          categoryId,
          categoryId,
          name,
          url
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

const getLinks = async (req: Request, res: Response) => {
  try {
    const mode = req.query.mode;
    const categoryId = req.query.categoryId;
    const name = req.query.name;

    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingLinks = dbConfig.db
      .prepare(
        mode === "own"
          ? `SELECT * FROM links WHERE user_id = ? AND (category_id = ? OR 1 = ?) AND name LIKE ?`
          : mode === "shared-unwritable"
          ? `SELECT links.* FROM links WHERE id IN (SELECT link_id FROM shares WHERE user_id = ? AND is_writable = 0) AND (category_id = ? OR 1 = ?) AND name LIKE ?`
          : `SELECT links.* FROM links WHERE id IN (SELECT link_id FROM shares WHERE user_id = ? AND is_writable = 1) AND (category_id = ? OR 1 = ?) AND name LIKE ?`
      )
      .all(
        sessionUserId,
        categoryId,
        categoryId === "all" ? 1 : 0,
        `%${name}%`
      ) as Link[];

    res.status(200).json({ message: "", data: existingLinks });
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

const updateLink = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const { categoryId, name, url } = req.body;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!linkId || !categoryId || !name || !url) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `UPDATE links SET category_id = ?, category_name = (SELECT name FROM categories WHERE id = ?), name = ?, url = ? WHERE id = ? AND (user_id = ? OR EXISTS (SELECT * FROM shares WHERE link_id = links.id AND user_id = ? AND is_writable = 1))`
    );

    stmt.run(
      categoryId,
      categoryId,
      name,
      url,
      linkId,
      sessionUserId,
      sessionUserId
    );

    const updatedLink = dbConfig.db
      .prepare(`SELECT * FROM links WHERE id = ?`)
      .get(linkId) as Link;

    if (updatedLink) {
      res
        .status(201)
        .json({ message: "Link updated successfully.", data: updatedLink });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default {
  addLink,
  getLinks,
  removeLink,
  updateLink,
};
