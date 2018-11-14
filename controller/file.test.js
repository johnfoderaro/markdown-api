const FileController = require('./file');

let res;
let req;
let next;
let fileModelMock;
let fileController;

beforeEach(() => {
  fileModelMock = {
    create({ name, data }) {
      return new Promise((resolve, reject) => {
        if (name && data) return resolve(true);
        return reject(new Error());
      });
    },
    deleteOne({ _id }) {
      return new Promise((resolve, reject) => {
        if (_id === 123) return resolve({ n: 1 });
        if (_id === 345) return resolve({ n: 0 });
        return reject(new Error());
      });
    },
    findById(id) {
      return new Promise((resolve, reject) => {
        if (id === 123) return resolve(true);
        if (id === 345) return resolve(false);
        return reject(new Error());
      });
    },
    updateOne({ _id }, { name, data }) {
      return new Promise((resolve, reject) => {
        if (_id === 123 && name && data) return resolve({ nModified: 1 });
        if (_id === 345 && name && data) return resolve({ nModified: 0 });
        return reject(new Error());
      });
    },
  };
  res = {
    send: jest.fn(),
    sendStatus: jest.fn(),
  };
  next = jest.fn();
  fileController = new FileController(fileModelMock);
});

describe('file', () => {
  describe('addFile', () => {
    it('should return call res.sendStatus', async () => {
      req = { body: { name: 'fileA', data: '123' } };
      await fileController.addFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { body: { data: '123' } };
      await fileController.addFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
  describe('deleteFile', () => {
    it('should call res.sendStatus', async () => {
      req = { body: { id: 123 } };
      await fileController.deleteFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should call res.sendStatus', async () => {
      req = { body: { id: 345 } };
      await fileController.deleteFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { body: { id: null } };
      await fileController.deleteFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
  describe('getFile', () => {
    it('should get a document and call res.send', async () => {
      req = { params: { id: 123 } };
      await fileController.getFile(req, res, next);
      expect(res.send).toBeCalledTimes(1);
    });
    it('should call res.sendStatus', async () => {
      req = { params: { id: 345 } };
      await fileController.getFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { params: { id: null } };
      await fileController.getFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
  describe('renameFile', () => {
    it('should call res.sendStatus', async () => {
      req = { body: { id: 123, name: 'fileA', data: '123' } };
      await fileController.renameFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should call res.sendStatus', async () => {
      req = { body: { id: 345, name: 'fileA', data: '123' } };
      await fileController.renameFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { body: { id: null, name: 'fileA', data: '123' } };
      await fileController.renameFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
});

afterEach(() => jest.resetAllMocks());
