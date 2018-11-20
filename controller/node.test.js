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
  nodeController = new NodeController(nodeModelMock);
});

describe('node', () => {
  describe('insertNode', () => {
    it('should return a 200 status', async () => {
      req = {
        body: {
          name: 'john',
          type: 'file',
          parent: 'root',
          id: 123,
        },
      };
      await nodeController.insertNode(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return a 500 status if updateOne does not modify a node', async () => {
      nodeController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
        _id: 500, // force !nModified from model mock
        toObject() {
          return nodeController.root;
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
      await nodeController.insertNode(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(500);
    });
    it('should catch error and call next when adding duplicate children', async () => {
      nodeController.root = {
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
          return nodeController.root;
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
      await nodeController.insertNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add duplicate children'));
    });
    it('should catch error and call next when inserting a node into a parent with type `file`', async () => {
      nodeController.root = {
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
          return nodeController.root;
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
      await nodeController.insertNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add child to node type of `file`'));
    });
    it('should catch error and call next when adding an orphan node', async () => {
      nodeController.root = {
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
          return nodeController.root;
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
      await nodeController.insertNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot have orphan nodes'));
    });
    it('should catch error and call next insert fails', async () => {
      nodeController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
        toObject() {
          return nodeController.root;
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
      nodeModelMock.updateOne = () => Promise.reject(new Error());
      await nodeController.insertNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error());
    });
  });
  describe('getTree', () => {
    it('should return an existing tree', async () => {
      req = { body: { name: 'john', parent: 'root' } };
      nodeController.root = {
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
          return nodeController.root;
        },
      };
      nodeModelMock.findOne = async () => Promise.resolve(nodeController.root);
      await nodeController.getTree(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith(nodeController.root);
    });
    it('should return a new tree', async () => {
      nodeModelMock.findOne = async ({ name, parent }) => {
        if (name === 'root' && !parent) {
          return Promise.resolve(nodeController.root);
        }
        return Promise.reject(new Error());
      };
      nodeModelMock.create = async node => Promise.resolve({
        ...node,
        toObject() {
          return node;
        },
      });
      await nodeController.getTree(req, res, next);
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
      nodeModelMock.findOne = () => Promise.reject(new Error());
      await nodeController.getTree(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error());
    });
  });
  describe('deleteNode', () => {
    it('should delete a node', async () => {
      nodeController.root = {
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
          return nodeController.root;
        },
      };
      req = { body: { name: 'paula', parent: 'john' } };
      nodeModelMock.updateOne = async ({ _id }, { children }) => {
        if (_id === 456 && children.length === 0) {
          return Promise.resolve({ nModified: true });
        }
        return Promise.resolve({ nModified: false });
      };
      await nodeController.deleteNode(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return an error when deleting the root node', async () => {
      req = { body: { name: 'root', parent: null } };
      await nodeController.deleteNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot delete root node'));
    });
    it('should return an error when deleting a non-existent node', async () => {
      nodeController.root = {
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
          return nodeController.root;
        },
      };
      req = { body: { name: 'paula', parent: 'john' } };
      await nodeController.deleteNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find node to delete'));
    });
    it('should return a 500 status if updatedOne does not modify a node', async () => {
      nodeController.root = {
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
          return nodeController.root;
        },
      };
      req = { body: { name: 'john', parent: 'root' } };
      nodeModelMock.updateOne = async () => Promise.resolve(false);
      await nodeController.deleteNode(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(500);
    });
  });
  describe('renameNode', () => {
    it('should return a 200 status', async () => {
      nodeController.root = {
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
          return nodeController.root;
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
      nodeModelMock.updateOne = async ({ _id }, { children }) => {
        if (_id === 123 && children.length === 1) {
          return Promise.resolve({ nModified: true });
        }
        return Promise.resolve({ nModified: false });
      };
      await nodeController.renameNode(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should catch error and call next when renaming root node', async () => {
      nodeController.root = {
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
          return nodeController.root;
        },
      };
      req = { body: { name: 'root', parent: null, update: { } } };
      await nodeController.renameNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot rename root node'));
    });
    it('should catch error and call next when updating an non-existent node', async () => {
      nodeController.root = {
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
          return nodeController.root;
        },
      };
      req = { body: { name: 'paula', parent: 'root', update: { } } };
      await nodeController.renameNode(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find node to rename'));
    });
  });
});

afterEach(() => jest.resetAllMocks());
