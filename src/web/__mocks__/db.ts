export const db = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
};

export const eq = jest.fn();
export const gt = jest.fn();
export const gte = jest.fn();
export const lt = jest.fn();
export const lte = jest.fn();
export const ne = jest.fn();
