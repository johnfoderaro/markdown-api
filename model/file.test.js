const FileModel = require('./file');

describe('File model', () => {
  it('should be invalid if required schema are missing', (done) => {
    const fileModel = new FileModel();
    fileModel.validate((error) => {
      expect(error.errors.name).toBeDefined();
      done();
    });
  });
  it('should be valid if required schema is present', (done) => {
    const fileModel = new FileModel({
      name: 'name',
      data: 'data',
    });
    fileModel.validate((error) => {
      expect(error).toBe(null);
      done();
    });
  });
});
