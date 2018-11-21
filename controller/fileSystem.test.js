const FileSystemController = require('./fileSystem');

let res;
let req;
let next;
let fileSystemModelMock;
let fileSystemController;

beforeEach(() => {
  fileSystemModelMock = {
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
        if (ready) {
          return resolve({
            name,
            type,
            parent,
            children,
            id,
          });
        }
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
        if (name === 'root' && !parent) {
          const doc = {
            toObject() {
              return {
                name: 'root',
                type: 'directory',
                parent: null,
                children: [],
                id: null,
              };
            },
          };
          return resolve(doc);
        }
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
      return new Promise((resolve) => {
        const isRoot = name === 'root';
        const isDirectory = type === 'directory';
        const isChildren = Array.isArray(children);
        const ready = isRoot && isDirectory && isChildren && !parent && !id;
        if (_id === 500) return resolve({ nModified: false });
        if (ready) return resolve({ nModified: true });
        return false;
      });
    },
  };
  res = {
    send: jest.fn(),
    sendStatus: jest.fn(),
  };
  next = jest.fn();
  fileSystemController = new FileSystemController(fileSystemModelMock);
});

describe('node', () => {
  describe('insert', () => {
    it('should return a 200 status', async () => {
      req = {
        body: {
          name: 'john',
          type: 'file',
          parent: 'root',
          id: 123,
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return a 500 status if updateOne does not modify a node', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
        _id: 500, // force !nModified from model mock
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'john',
          type: 'file',
          parent: 'root',
          id: 123,
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(500);
    });
    it('should catch error and call next when adding duplicate children', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'file',
          parent: 'root',
          children: [],
          id: 123,
        }],
        id: null,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'john',
          type: 'file',
          parent: 'root',
          children: [],
          id: 123,
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add duplicate children'));
    });
    it('should catch error and call next when inserting a node into a parent with type `file`', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'file',
          parent: 'root',
          children: [],
          id: 123,
        }],
        id: null,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'paula',
          type: 'file',
          parent: 'john',
          children: [],
          id: 123,
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add child to node type of `file`'));
    });
    it('should catch error and call next when adding an orphan node', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          children: [],
          id: 123,
        }],
        id: null,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'paula',
          type: 'file',
          parent: null,
          children: [],
          id: 123,
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot have orphan nodes'));
    });
    it('should catch error and call next insert fails', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'john',
          type: 'file',
          parent: 'root',
          id: 123,
        },
      };
      fileSystemModelMock.updateOne = () => Promise.reject(new Error());
      await fileSystemController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error());
    });
  });
  describe('get', () => {
    it('should return an existing tree', async () => {
      req = { body: { name: 'john', parent: 'root' } };
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [{
            name: 'paula',
            type: 'file',
            parent: 'john',
            id: 789,
          }],
        }],
        id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      fileSystemModelMock.findOne = async () => Promise.resolve(fileSystemController.root);
      await fileSystemController.get(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith(fileSystemController.root);
    });
    it('should return a new tree', async () => {
      fileSystemModelMock.findOne = async ({ name, parent }) => {
        if (name === 'root' && !parent) {
          return Promise.resolve(fileSystemController.root);
        }
        return Promise.reject(new Error());
      };
      fileSystemModelMock.create = async node => Promise.resolve({
        ...node,
        toObject() {
          return node;
        },
      });
      await fileSystemController.get(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
      });
    });
    it('should call next with a rejected promise containing an error object', async () => {
      fileSystemModelMock.findOne = () => Promise.reject(new Error());
      await fileSystemController.get(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error());
    });
  });
  describe('remove', () => {
    it('should remove a node', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [{
            name: 'paula',
            type: 'file',
            parent: 'john',
            id: 789,
          }],
        }],
        id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = { body: { name: 'paula', parent: 'john' } };
      fileSystemModelMock.updateOne = async ({ _id }, { children }) => {
        if (_id === 456 && children.length === 0) {
          return Promise.resolve({ nModified: true });
        }
        return Promise.resolve({ nModified: false });
      };
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return an error when deleting the root node', async () => {
      req = { body: { name: 'root', parent: null } };
      await fileSystemController.remove(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot delete root node'));
    });
    it('should return an error when deleting a non-existent node', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [],
        }],
        id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = { body: { name: 'paula', parent: 'john' } };
      await fileSystemController.remove(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find node to delete'));
    });
    it('should return a 500 status if updatedOne does not modify a node', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [],
        }],
        id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = { body: { name: 'john', parent: 'root' } };
      fileSystemModelMock.updateOne = async () => Promise.resolve(false);
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(500);
    });
  });
  describe('rename', () => {
    it('should return a 200 status', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [],
        }],
        id: 123,
        _id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'john',
          parent: 'root',
          update: {
            name: 'paula',
            parent: 'root',
            type: 'file',
            id: 456,
            children: [],
          },
        },
      };
      fileSystemModelMock.updateOne = async ({ _id }, { children }) => {
        if (_id === 123 && children.length === 1) {
          return Promise.resolve({ nModified: true });
        }
        return Promise.resolve({ nModified: false });
      };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return a 200 status', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [{
            name: 'paula',
            type: 'directory',
            parent: 'john',
            id: 789,
            children: [],
          }],
        }],
        id: 123,
        _id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'paula',
          parent: 'john',
          update: {
            name: 'emma',
            parent: 'john',
            type: 'file',
            id: 789,
            children: [],
          },
        },
      };
      fileSystemModelMock.updateOne = async ({ _id }, { children }) => {
        if (_id === 456 && children.length === 1) {
          return Promise.resolve({ nModified: true });
        }
        return Promise.resolve({ nModified: false });
      };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return a 500 status', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [{
            name: 'paula',
            type: 'directory',
            parent: 'john',
            id: 789,
            children: [],
          }],
        }],
        id: 123,
        _id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = {
        body: {
          name: 'paula',
          parent: 'john',
          update: {
            name: 'emma',
            parent: 'john',
            type: 'file',
            id: 789,
            children: [],
          },
        },
      };
      // mocks an nModified 0 result from mongo
      fileSystemModelMock.updateOne = async ({ _id }, { children }) => {
        if (_id === 123 && children.length === 1) {
          return Promise.resolve({ nModified: true });
        }
        return Promise.resolve({ nModified: false });
      };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(500);
    });
    it('should catch error and call next when renaming root node', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [],
        }],
        id: 123,
        _id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = { body: { name: 'root', parent: null, update: { } } };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot rename root node'));
    });
    it('should catch error and call next when updating an non-existent node', async () => {
      fileSystemController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [{
          name: 'john',
          type: 'directory',
          parent: 'root',
          id: 456,
          children: [],
        }],
        id: 123,
        toObject() {
          return fileSystemController.root;
        },
      };
      req = { body: { name: 'paula', parent: 'root', update: { } } };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find node to rename'));
    });
  });
});

afterEach(() => jest.resetAllMocks());
