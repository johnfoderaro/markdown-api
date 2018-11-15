const NodeController = require('./node');

let res;
let req;
let next;
let nodeModelMock;
let nodeController;

beforeEach(() => {
  nodeModelMock = {
    create({
      name,
      type,
      parent,
      children,
      id,
    }) {
      return new Promise((resolve, reject) => {
        const isRoot = name === 'root';
        const isDirectory = type === 'directory';
        const emptyChildrenArr = Array.isArray(children) && children.length === 0;
        const ready = isRoot && isDirectory && emptyChildrenArr && !parent && !id;
        if (ready) return resolve(true);
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
    findOne({ name, parent }) {
      return new Promise((resolve, reject) => {
        if (name === 'root' && !parent) return resolve(true);
        if (name !== 'root' && !parent) return resolve(false);
        return reject(new Error());
      });
    },
    updateOne({ _id }, {
      name,
      parent,
      type,
      id,
      children,
    }) {
      return new Promise((resolve, reject) => {
        const ready = name && type && Array.isArray(children) && parent && id && _id;
        if (ready) return resolve(true);
        return reject(new Error());
      });
    },
  };
  res = {
    send: jest.fn(),
    sendStatus: jest.fn(),
  };
  next = jest.fn();
  nodeController = new NodeController(nodeModelMock);
});

describe('node', () => {
  describe('insertNode', () => {
    it('should return a 200 status', () => {
      req = {
        body: {
          name: 'john',
          type: 'file',
          parent: 'root',
          id: 123,
        },
      };
    });
  });
  // describe()
  describe('addFile', () => {
    it('should return a', async () => {
      req = { body: { name: 'fileA', data: '123' } };
      await nodeController.addFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { body: { data: '123' } };
      await nodeController.addFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
  describe('deleteFile', () => {
    it('should call res.sendStatus', async () => {
      req = { body: { id: 123 } };
      await nodeController.deleteFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should call res.sendStatus', async () => {
      req = { body: { id: 345 } };
      await nodeController.deleteFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { body: { id: null } };
      await nodeController.deleteFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
  describe('getFile', () => {
    it('should get a document and call res.send', async () => {
      req = { params: { id: 123 } };
      await nodeController.getFile(req, res, next);
      expect(res.send).toBeCalledTimes(1);
    });
    it('should call res.sendStatus', async () => {
      req = { params: { id: 345 } };
      await nodeController.getFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { params: { id: null } };
      await nodeController.getFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
  describe('renameFile', () => {
    it('should call res.sendStatus', async () => {
      req = { body: { id: 123, name: 'fileA', data: '123' } };
      await nodeController.renameFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should call res.sendStatus', async () => {
      req = { body: { id: 345, name: 'fileA', data: '123' } };
      await nodeController.renameFile(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
    });
    it('should catch an error and call next', async () => {
      req = { body: { id: null, name: 'fileA', data: '123' } };
      await nodeController.renameFile(req, res, next);
      expect(next).toBeCalledTimes(1);
    });
  });
});

afterEach(() => jest.resetAllMocks());
