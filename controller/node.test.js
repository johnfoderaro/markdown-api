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
      return new Promise((resolve, reject) => {
        const isRoot = name === 'root';
        const isDirectory = type === 'directory';
        const isChildren = Array.isArray(children);
        const ready = isRoot && isDirectory && isChildren && !parent && !id;
        if (_id === null) return reject(new Error());
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
    it('should create a new tree when one is not found', async () => {
      nodeModelMock.findOne = () => Promise.resolve(false);
      nodeController = new NodeController(nodeModelMock);
      await nodeController.insertNode(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should reject promise with an error when adding a duplicate', () => {
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
      expect(nodeController.insertNode(req, res, next))
        .rejects.toEqual(new Error('Cannot add duplicate children'));
    });
    it('should reject promise with an error when adding a duplicate', () => {
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
      expect(nodeController.insertNode(req, res, next))
        .rejects.toEqual(new Error('Cannot add child to node type of `file`'));
    });
    it('should reject promise with an error when adding an orphan node', () => {
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
      expect(nodeController.insertNode(req, res, next))
        .rejects.toEqual(new Error('Cannot have orphan nodes'));
    });
    it('should catch an error and call next', async () => {
      nodeController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
        _id: null, // force a reject(new Error()) from model mock
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
      expect(next).toBeCalledTimes(1);
    });
    it('should call res.sendStatus', async () => {
      nodeController.root = {
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
        _id: 500, // force !nModified from model mock
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
  });
});

afterEach(() => jest.resetAllMocks());
