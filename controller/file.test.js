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
      return Promise.resolve({ n: 1, nModified: 1 });
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
      expect(res.send).toHaveBeenNthCalledWith(1, { name: 'file1', data: 'data' });
    });

    it('should return a 404 status if findById fails', async () => {
      req = { params: { id: '100' } };
      fileModelMock.findById = () => null;
      await fileController.get(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 404);
    });

    it('should return a 400 status if parameters are invalid', async () => {
      req = { params: { id: null } };
      await fileController.get(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });

    it('should return a 500 status if findById fails', async () => {
      req = { params: { id: '100' } };
      fileModelMock.findById = () => {
        throw new Error();
      };
      await fileController.get(req, res, next);
      expect(next).toHaveBeenNthCalledWith(1, new Error());
    });
  });


  describe('insert', () => {
    it('should return a document id', async () => {
      req = { body: { name: 'fileA', data: 'fileA' } };
      await fileController.insert(req, res, next);
      expect(res.send).toHaveBeenNthCalledWith(1, { id: '100' });
    });

    it('should return a 400 status if parameters are invalid', async () => {
      req = { body: { name: 'fileA' } };
      await fileController.insert(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });

    it('should return a 500 status if create fails', async () => {
      req = { body: { name: 'fileA', data: 'fileA' } };
      fileModelMock.create = () => {
        throw new Error();
      };
      await fileController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });


  describe('remove', () => {
    it('should return a 200 status', async () => {
      req = { params: { id: '100' } };
      await fileController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 200);
    });

    it('should return a 404 status if deleteOne fails', async () => {
      req = { params: { id: '100' } };
      fileModelMock.deleteOne = () => ({ nModified: 0 });
      await fileController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 404);
    });

    it('should return a 400 status if parameters are invalid', async () => {
      req = { params: { } };
      await fileController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });

    it('should return a 500 status if deleteOne throws', async () => {
      req = { body: { name: 'fileA', data: 'fileA' } };
      fileModelMock.deleteOne = () => {
        throw new Error();
      };
      await fileController.remove(req, res, next);
      expect(next).toBeCalledTimes(1, new Error());
    });
  });

  describe('update', () => {
    it('should return a 200 status', async () => {
      req = { body: { id: '100', update: { name: '', data: 'updated data' } } };
      await fileController.update(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 200);
    });

    it('should return a 400 status if updateOne does not update anything', async () => {
      req = { body: { id: '100', update: { name: '', data: 'updated data' } } };
      fileModelMock.updateOne = jest.fn(() => ({ n: 1, nModified: 0 }));
      await fileController.update(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });

    it('should return a 404 status if updateOne fails', async () => {
      req = { body: { id: '100', update: { data: 'updated data' } } };
      fileModelMock.updateOne = jest.fn(() => ({ n: 0, nModified: 0 }));
      await fileController.update(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 404);
    });

    it('should return a 500 status if result isn\'t success, not found, bad request', async () => {
      req = { body: { id: '100', update: { data: 'updated data' } } };
      fileModelMock.updateOne = jest.fn(() => ({ n: 2, nModified: 0 }));
      await fileController.update(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 500);
    });

    it('should catch error and call next when updateOne throws', async () => {
      req = { body: { id: '100', update: { name: '', data: 'updated data' } } };
      fileModelMock.updateOne = () => {
        throw new Error();
      };
      await fileController.update(req, res, next);
      expect(next).toBeCalledTimes(1, new Error());
    });

    it('should return a 400 status if parameters are invalid', async () => {
      req = { body: { } };
      await fileController.update(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
  });
});

afterEach(() => jest.resetAllMocks());
