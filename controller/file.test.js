const FileController = require('./file');

let res;
let req;
let next;
let fileModelMock;
let fileController;

beforeEach(() => {
  fileModelMock = {
    create({ name, data }) {
      return Promise.resolve({ _id: '100', name, data });
    },
    deleteOne() {
      return Promise.resolve({ n: 1 });
    },
    findById() {
      return Promise.resolve({ name: 'file1', data: 'data' });
    },
    updateOne() {
      return Promise.resolve({ nModified: 1 });
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
  describe('get', () => {
    it('should return a document', async () => {
      req = { params: { id: '100' } };
      await fileController.get(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({ name: 'file1', data: 'data' });
    });
    it('should return a 404 status if findById fails', async () => {
      req = { params: { id: '100' } };
      fileModelMock.findById = () => null;
      await fileController.get(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(404);
    });
    it('should return an error when parameters are invalid', async () => {
      req = { params: { id: null } };
      await fileController.get(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `id` parameter'));
    });
  });
  describe('insert', () => {
    it('should return a document id', async () => {
      req = { body: { name: 'fileA', data: 'fileA' } };
      await fileController.insert(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({ id: '100' });
    });
    it('should return a 500 status if create fails', async () => {
      req = { body: { name: 'fileA', data: 'fileA' } };
      fileModelMock.create = () => {
        throw new Error();
      };
      await fileController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
    it('should return an error when parameters are invalid', async () => {
      req = { body: { name: 'fileA' } };
      await fileController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
  describe('remove', () => {
    it('should return a 200 status', async () => {
      req = { body: { id: '100' } };
      await fileController.remove(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return a 404 status if deleteOne fails', async () => {
      req = { body: { id: '100' } };
      fileModelMock.deleteOne = () => ({ nModified: 0 });
      await fileController.remove(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(404);
    });
    it('should return an error when parameters are invalid', async () => {
      req = { body: { } };
      await fileController.remove(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `id`'));
    });
  });

  describe('rename', () => {
    it('should return a 200 status', async () => {
      req = { body: { id: '100', update: { name: 'fileA' } } };
      await fileController.rename(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should return a 404 status if updateOne fails', async () => {
      req = { body: { id: '100', update: { name: 'fileA' } } };
      fileModelMock.updateOne = () => ({ nModified: 0 });
      await fileController.rename(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(404);
    });
    it('should return an error when parameters are invalid', async () => {
      req = { body: { } };
      await fileController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `id` and `update`'));
    });
  });
});

afterEach(() => jest.resetAllMocks());
