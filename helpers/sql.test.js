const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFiltering } = require("./sql");

const data = { name: "Test", val1: "A", val2: "B", multiName: "Test Test"};
const jsToSql = { multiName: "multi_name" };


describe("Tests sqlForPartialUpdate functionality", () => {
  test("valid inputs", () => {
    const result = sqlForPartialUpdate(data, jsToSql);
//single quotes
    expect(result.setCols).toEqual("\"name\"=$1, \"val1\"=$2, \"val2\"=$3, \"multi_name\"=$4");
    expect(result.values).toEqual(["Test", "A", "B", "Test Test"]);
  });

  test("invalid inputs", () => {
    try {
      sqlForPartialUpdate({}, jsToSql);
      fail("should've thrown bad request error")
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
      expect(e.message).toEqual("No data");
    }
  });
})

describe("Tests sqlForFiltering functionality", () => {
  test("valid inputs", () => {
    const result = sqlForFiltering({name: "julia", minEmployees: "20"});
    expect(result.sqlCols).toEqual(`name ILIKE '%' || $1 || '%' AND num_employees >= $2 `);
    expect(result.values).toEqual(["julia", "20"]);
  });

  test("invalid inputs", () => {
    try {
      sqlForFiltering({minEmployees: "20", maxEmployees: "13"});
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
      expect(e.message).toEqual("min employees can't be greater than max employees");
    }
  });
})