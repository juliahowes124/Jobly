"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilteringJob } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   * Uses sqlForFilteringJob to generate filtering commands for sql query
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filterParams) {
    let { sqlCols, values } = sqlForFilteringJob(filterParams);
    
    const jobsRes = await db.query(
      `SELECT
          title,
          salary,
          equity,
          company_handle AS "companyHandle"
           FROM jobs
           ${sqlCols ? "WHERE " + sqlCols : ""}
           ORDER BY title`,
      values
    );
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { title, salary, equity, companyHandle }
   *
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    data = { ...data, companyHandle: undefined, id: undefined };
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }
}


module.exports = Job;
