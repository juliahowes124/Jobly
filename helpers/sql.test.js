const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

const data = { name: "Test", val1: "A", val2: "B", multiName: "Test Test"};
const jsToSql = { multiName: "multi_name" };


describe("Tests sqlForPartialUpdate functionality", () => {
  test("valid inputs", () => {
    const result = sqlForPartialUpdate(data, jsToSql);

    expect(result.setCols).toEqual("\"name\"=$1, \"val1\"=$2, \"val2\"=$3, \"multi_name\"=$4");
    expect(result.values).toEqual(["Test", "A", "B", "Test Test"]);
  });

  test("invalid inputs", () => {
    try {
      sqlForPartialUpdate({}, jsToSql);
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
      expect(e.message).toEqual("No data");
    }
  });
})