const mongoose = require('mongoose');
const FileSystemModel = require('./fileSystem');

describe('FileSystem model', () => {
  it('should be invalid if required schema are missing', (done) => {
    const fileSystemModel = new FileSystemModel();
    fileSystemModel.validate((error) => {
      expect(error.errors.name).toBeDefined();
      expect(error.errors.type).toBeDefined();
      done();
    });
  });
  it('should be valid if required schema is present', (done) => {
    const id = mongoose.Types.ObjectId('4edd40c86762e0fb12000003');
    const fileSystemModel = new FileSystemModel({
      id,
      name: 'name',
      type: 'type',
      parent: 'parent',
      children: [{ name: 'name' }],
    });
    fileSystemModel.validate((error) => {
      expect(error).toBe(null);
      done();
    });
  });
});
