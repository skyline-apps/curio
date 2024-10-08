import "@testing-library/jest-dom";

import { db } from "__mocks__/db";

beforeEach(() => {
  db.insert.mockReturnThis();
  db.update.mockReturnThis();
  db.set.mockReturnThis();
  db.where.mockReturnThis();
  db.values.mockReturnThis();
  db.returning.mockReturnThis();
  db.select.mockReturnThis();
  db.from.mockReturnThis();
  db.query.profiles.findFirst.mockReturnThis();
});
