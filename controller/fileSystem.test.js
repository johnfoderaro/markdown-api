const FileSystemController = require('./fileSystem');

let res;
let req;
let next;
let fileSystemModelMock;
let fileSystemController;

beforeEach(() => {
  const tree = {
    _id: '100',
    id: null,
    name: 'root',
    type: 'dir',
    parent: null,
    children: [],
  };
  fileSystemModelMock = {
    create() {
      return Promise.resolve(tree);
    },
    findOne() {
      return Promise.resolve(tree);
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
  describe('get', () => {
    it('should return a new tree', async () => {
      fileSystemModelMock.findOne = async () => null;
      await fileSystemController.get(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({
        id: null,
        name: 'root',
        type: 'dir',
        parent: null,
        children: [],
      });
    });
    it('should return an existing tree', async () => {
      req = { body: { name: 'john', parent: 'root' } };
      fileSystemController.tree = {
        id: null,
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
      fileSystemModelMock.findOne = async () => Promise.resolve(fileSystemController.tree);
      await fileSystemController.get(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith(fileSystemController.tree);
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
  describe('insert', () => {
    it('should return the updated tree', async () => {
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
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({
        _id: '100',
        id: null,
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '100',
          name: 'file1',
          type: 'file',
          parent: 'root',
          children: [],
        }],
      });
    });
    it('should return a 400 status if updateOne does not modify root node', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      expect(res.sendStatus).toBeCalledWith(400);
    });
    it('should return a 400 status when parameters are invalid', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when `type` file does not have `id`', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
        name: 'root',
        type: 'dir',
        parent: null,
        children: [],
      };
      req = {
        body: {
          id: null,
          name: 'file1',
          type: 'file',
          parent: 'root',
          children: [],
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when unable to find parent node', async () => {
      req = {
        body: {
          id: '100',
          name: 'file1',
          type: 'file',
          parent: 'dirA',
          children: [],
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when adding duplicate children', async () => {
      fileSystemController.tree = {
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
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when inserting into a parent with type `file`', async () => {
      fileSystemController.tree = {
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
          id: '102',
          name: 'file2',
          type: 'file',
          parent: 'file1',
          children: [],
        },
      };
      await fileSystemController.insert(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
  });
  describe('remove', () => {
    it('should return the updated tree', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      req = { params: { name: 'dir1', parent: 'root' } };
      await fileSystemController.remove(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({
        _id: '100',
        id: null,
        name: 'root',
        type: 'dir',
        parent: null,
        children: [],
      });
    });
    it('should return a 400 status if updateOne does not modify root node', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      req = { params: { name: 'dir1', parent: 'root' } };
      fileSystemModelMock.updateOne = () => Promise.resolve({ nModified: false });
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when parameters are invalid', async () => {
      req = { params: {} };
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when attempting to remove the root node', async () => {
      req = { params: { name: 'root', parent: 'null' } };
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when unable to find parent node', async () => {
      req = { params: { name: 'file1', parent: 'dir1' } };
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 404 when removing a non-existent node', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      req = { params: { name: 'file2', parent: 'root' } };
      await fileSystemController.remove(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 404);
    });
  });
  describe('rename', () => {
    it('should return the updated tree', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      fileSystemModelMock.findOne = async () => Promise.resolve(fileSystemController.tree);
      await fileSystemController.rename(req, res, next);
      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith({
        _id: '100',
        id: null,
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: null,
          name: 'dirA',
          type: 'dir',
          parent: 'root',
          children: [{
            id: null,
            name: 'dirB',
            type: 'dir',
            parent: 'dirA',
            children: [],
          }],
        }],
      });
    });
    it('should return a 400 status if updateOne does not modify root node', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      req = { body: { name: 'dir1', parent: 'root', update: { name: 'dirB' } } };
      fileSystemModelMock.updateOne = () => Promise.resolve({ nModified: false });
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toBeCalledTimes(1);
      expect(res.sendStatus).toBeCalledWith(400);
    });
    it('should return a 400 status when parameters are invalid', async () => {
      req = { body: {} };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when attemtping to update root node', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      req = { body: { name: 'root', parent: '100', update: { } } };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when unable to find parent node', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 400 status when adding duplicate children', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
        name: 'root',
        type: 'dir',
        parent: null,
        children: [{
          id: '101',
          name: 'dirA',
          type: 'dir',
          parent: 'root',
          children: [],
        }, {
          id: '102',
          name: 'dirB',
          type: 'dir',
          parent: 'root',
          children: [],
        }],
      };
      req = {
        body: {
          id: '102',
          name: 'dirB',
          type: 'file',
          parent: 'root',
          children: [],
          update: {
            name: 'dirA',
          },
        },
      };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 400);
    });
    it('should return a 404 status when updating an non-existent node', async () => {
      fileSystemController.tree = {
        _id: '100',
        id: null,
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
      req = { body: { name: 'dir2', parent: 'root', update: { name: 'dirA' } } };
      await fileSystemController.rename(req, res, next);
      expect(res.sendStatus).toHaveBeenNthCalledWith(1, 404);
    });
  });
});

afterEach(() => jest.resetAllMocks());
