"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const {
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrCorrectUser,
} = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const { remove } = require("../models/job");

const router = express.Router();

router.get("/:id", async (req, res) => {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

router.post("/", ensureLoggedIn, ensureAdmin, async (req, res) => {
  const validator = jsonschema.validate(req.body, jobNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

router.patch("/:id", ensureLoggedIn, ensureAdmin, async (req, res) => {
  const validator = jsonschema.validate(req.body, jobUpdateSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});

router.delete("/:id", ensureLoggedIn, ensureAdmin, async (req, res) => {
  const { id } = await Job.remove(req.params.id);
  return res.json({ message: `Job id ${id} was removed` });
})



module.exports = router;