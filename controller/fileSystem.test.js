const FileSystemController = require('./fileSystem');

let res;
let req;
let next;
let fileSystemModelMock;
let fileSystemController;

beforeEach(() => {
  const rootNode = {
    _id: '100',
    name: 'root',
    type: 'dir',
    parent: null,
    children: [],
  };
  fileSystemModelMock = {
    create() {
      return Promise.resolve(rootNode);
    },
    findOne() {
      return Promise.resolve(rootNode);
    },
    updateOne() {
      return Promise.resolve({ nModified: true });
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
          id: '100',
          name: 'file1',
          type: 'file',
          parent: 'root',
          children: [],
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
      fileSystemController.root = null;
      req = {
        body: {
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(2);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return a 500 status if updateOne does not modify root node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [],
      };
      req = {
        body: {
          id: '101',
          name: 'john',
          type: 'file',
          parent: 'root',
          children: [],
        },
      };
      fileSystemModelMock.updateOne = () => Promise.resolve({ nModified: false });
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(500);
    });
    it('should catch error and call next when adding duplicate children', async () => {
      fileSystemController.root = {
        _id: '100',
        id: null,
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'file1',
          type: 'file',
          parent: 'root',
          children: [],
        }],
      };
      req = {
        body: {
          id: '101',
          name: 'file1',
          type: 'file',
          parent: 'root',
          children: [],
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add duplicate children'));
    });
    it('should catch error and call next when inserting a node into a parent with type `file`', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'file1',
          type: 'file',
          parent: 'root',
          children: [],
        }],
      };
      req = {
        body: {
          id: '102',
          name: 'file2',
          type: 'file',
          parent: 'file1',
          children: [],
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add child to node type of `file`'));
    });
    it('should catch error and call next when parameters are invalid', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [],
      };
      req = {
        body: {
          id: '101',
          name: 'file1',
          type: 'file',
          parent: 'root',
        },
      };
      fileSystemModelMock.updateOne = () => Promise.reject(new Error());
      await fileSystemController.insert(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `name`, `type`, `parent`, `id` and `children`'));
    });
  });
  describe('get', () => {
    it('should return a new tree', async () => {
      fileSystemModelMock.findOne = async () => null;
      await fileSystemController.get(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [],
      });
    });
    it('should return an existing tree', async () => {
      req = { body: { name: 'john', parent: 'root' } };
      fileSystemController.root = {
        id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [{
            id: '201',
            name: 'file1',
            type: 'file',
            parent: 'dir1',
          }],
        }],
      };
      fileSystemModelMock.findOne = async () => Promise.resolve(fileSystemController.root);
      await fileSystemController.get(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith(fileSystemController.root);
    });
    it('should catch error and call next when currentTree throws', async () => {
      fileSystemController.currentTree = () => {
        throw new Error();
      };
      await fileSystemController.get(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error());
    });
  });
  describe('remove', () => {
    it('should return a 200 status', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [{
            id: '201',
            name: 'file1',
            type: 'file',
            parent: 'dir1',
          }],
        }],
      };
      req = { body: { name: 'file1', parent: 'dir1' } };
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should return an error when deleting the root node', async () => {
      req = { body: { name: 'root', parent: null } };
      await fileSystemController.remove(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `name` and `parent`'));
    });
    it('should return an error when it cannot find the parent node', async () => {
      req = { body: { name: 'file1', parent: 'dir1' } };
      await fileSystemController.remove(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find parent node'));
    });
    it('should return an error when deleting a non-existent node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'file1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = { body: { name: 'file2', parent: 'root' } };
      await fileSystemController.remove(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find node to delete'));
    });
    it('should catch error and call next when attemtping to update root node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      // FIXME do we need to even test this?
      req = { body: { name: 'root', parent: 'root', update: { } } };
      await fileSystemController.remove(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot remove root node'));
    });
    it('should catch error and call next when parameters are invalid', async () => {
      req = { body: {} };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `name`, `parent`, `update`'));
    });
  });
  describe('rename', () => {
    it('should return a 200 status', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [{
            id: null,
            name: 'dirB',
            type: 'dir',
            parent: 'dir1',
            children: [],
          }],
        }],
      };
      req = {
        body: {
          name: 'dir1',
          parent: 'root',
          update: {
            id: null,
            name: 'dirA',
            parent: 'root',
            type: 'dir',
            children: [],
          },
        },
      };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should catch error and call next when renaming root node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      // FIXME do we need this? should parent never be null when validating like other methods?
      req = { body: { name: 'root', parent: null, update: { } } };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `name`, `parent`, `update`'));
    });
    it('should catch error and call next when updating an non-existent node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = { body: { name: 'dir2', parent: 'root', update: { } } };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find node to rename'));
    });
    it('should catch error and call next when unable to find parent node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = { body: { name: 'dir3', parent: 'dir2', update: { } } };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find parent node'));
    });
    it('should catch error and call next when attemtping to update root node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      // FIXME do we need this since parent is required but root.parent is null?
      req = { body: { name: 'root', parent: '100', update: { } } };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot rename root node'));
    });
    it('should catch error and call next when parameters are invalid', async () => {
      req = { body: {} };
      await fileSystemController.rename(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `name`, `parent`, `update`'));
    });
  });
  describe('move', () => {
    it('should return a 200 status', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [{
            id: null,
            name: 'dir2',
            type: 'dir',
            parent: 'dir1',
            children: [{
              id: '301',
              name: 'file1',
              type: 'file',
              parent: 'dir2',
            }],
          }],
        }],
      };
      req = {
        body: {
          id: null,
          name: 'dir2',
          parent: 'dir1',
          update: { parent: 'root' },
        },
      };
      await fileSystemController.move(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(200);
    });
    it('should catch error and call next when moving where there is an existing node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [{
            id: null,
            name: 'dir1',
            type: 'dir',
            parent: 'dir1',
            children: [],
          }],
        }],
      };
      req = {
        body: {
          id: null,
          name: 'dir1',
          parent: 'dir1',
          update: { parent: 'root' },
        },
      };
      await fileSystemController.move(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add duplicate children'));
    });
    it('should catch error and call next when inserting a node into a parent with type `file`', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'file1',
          type: 'file',
          parent: 'root',
          children: [],
        }, {
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = {
        body: {
          id: null,
          name: 'dir1',
          parent: 'root',
          update: { parent: 'file1' },
        },
      };
      await fileSystemController.move(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot add child to node type of `file`'));
    });
    it('should catch error and call next when trying to move root node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = {
        body: {
          id: '100',
          name: 'root',
          parent: 'root',
          update: { parent: 'dir1' },
        },
      };
      await fileSystemController.move(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot move root node'));
    });
    it('should catch error and call next when unable to find parent node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dir1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = {
        body: {
          id: null,
          name: 'file1',
          parent: 'dir2',
          update: { parent: 'root' },
        },
      };
      await fileSystemController.move(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find parent node'));
    });
    it('should catch error and call next when parameters are invalid', async () => {
      req = { body: {} };
      await fileSystemController.move(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Request must include `id`, `name`, `type`, and `parent`'));
    });
    it('should catch error when updating an non-existent node', async () => {
      fileSystemController.root = {
        _id: '100',
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'file1',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = {
        body: {
          id: null,
          name: 'file2',
          parent: 'root',
          update: { parent: 'dir1' },
        },
      };
      await fileSystemController.move(req, res, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new Error('Cannot find node to move'));
    });
  });
});

afterEach(() => jest.resetAllMocks());
