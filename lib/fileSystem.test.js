const FileSystem = require('./fileSystem');

let fileSystem;

beforeEach(() => {
  fileSystem = new FileSystem();
});

describe('FileSystem', () => {
  it('should be a constructor', () => {
    expect(FileSystem).toBeInstanceOf(Function);
  });
  it('should have a static method node()', () => {
    expect(FileSystem.node({
      name: 'test',
      type: 'file',
    })).toEqual({
      name: 'test',
      type: 'file',
      parent: null,
      children: [],
    });
  });
});

describe('fileSystem', () => {
  it('should be an instance of FileSystem class', () => {
    expect(fileSystem).toBeInstanceOf(FileSystem);
    expect(fileSystem).toHaveProperty('root');
    expect(fileSystem).toHaveProperty('queue');
  });
});

describe('fileSystem.enqueue', () => {
  it('should enqueue to this.queue array', () => {
    fileSystem.enqueue('a');
    fileSystem.enqueue('b');
    fileSystem.enqueue('c');
    expect(fileSystem.queue).toEqual(['a', 'b', 'c']);
  });
});

describe('fileSystem.dequeue', () => {
  it('should dequeue from this.queue array', () => {
    fileSystem.enqueue('a');
    fileSystem.enqueue('b');
    fileSystem.enqueue('c');
    expect(fileSystem.dequeue()).toEqual('a');
    expect(fileSystem.queue).toEqual(['b', 'c']);
  });
});

describe('fileSystem.add', () => {
  it('should add a node', () => {
    fileSystem.add({ name: 'a', type: 'file', parent: 'root' });
    fileSystem.add({ name: 'b', type: 'directory', parent: 'root' });
    fileSystem.add({ name: 'c', type: 'file', parent: 'b' });
    expect(fileSystem.root.children).toEqual([{
      name: 'a',
      type: 'file',
      parent: 'root',
      children: [],
    }, {
      name: 'b',
      type: 'directory',
      parent: 'root',
      children: [{
        name: 'c',
        type: 'file',
        parent: 'b',
        children: [],
      }],
    }]);
  });
  it('should not add node with type file as a child to type file nodes', () => {
    expect(() => {
      fileSystem.add({ name: 'fileA', type: 'file', parent: 'root' });
      fileSystem.add({ name: 'fileB', type: 'file', parent: 'root' });
      fileSystem.add({ name: 'fileC', type: 'file', parent: 'fileB' });
    }).toThrow();
  });
  it('should not add duplicate children to a node', () => {
    expect(() => {
      fileSystem.add({ name: 'fileA', type: 'file', parent: 'root' });
      fileSystem.add({ name: 'fileB', type: 'file', parent: 'root' });
      fileSystem.add({ name: 'fileB', type: 'file', parent: 'root' });
    }).toThrow();
  });
});

describe('fileSystem.del', () => {
  it('should delete a file node', () => {
    fileSystem.add({ name: 'fileA', type: 'file', parent: 'root' });
    fileSystem.add({ name: 'fileB', type: 'file', parent: 'root' });
    fileSystem.add({ name: 'fileC', type: 'file', parent: 'root' });
    fileSystem.del({ name: 'fileB', type: 'file', parent: 'root' });
    expect(fileSystem.root.children).toEqual([{
      name: 'fileA',
      type: 'file',
      parent: 'root',
      children: [],
    }, {
      name: 'fileC',
      type: 'file',
      parent: 'root',
      children: [],
    }]);
  });
  it('should delete a directory node', () => {
    fileSystem.add({ name: 'fileA', type: 'file', parent: 'root' });
    fileSystem.add({ name: 'directoryA', type: 'directory', parent: 'root' });
    fileSystem.add({ name: 'fileB', type: 'file', parent: 'directoryA' });
    fileSystem.del({ name: 'directoryA', type: 'directory', parent: 'root' });
    expect(fileSystem.root.children).toEqual([{
      name: 'fileA',
      type: 'file',
      parent: 'root',
      children: [],
    }]);
  });
});

describe('fileSystem.rename', () => {
  it('should rename a node\'s name', () => {
    const before = { name: 'fileB', type: 'file', parent: 'root' };
    const after = { name: 'fileC', type: 'file', parent: 'root' };
    fileSystem.add({ name: 'fileA', type: 'file', parent: 'root' });
    fileSystem.add({ name: 'fileB', type: 'file', parent: 'root' });
    fileSystem.rename(before, after);
    expect(fileSystem.root.children).toEqual([{
      name: 'fileA',
      type: 'file',
      parent: 'root',
      children: [],
    }, {
      name: 'fileC',
      type: 'file',
      parent: 'root',
      children: [],
    }]);
  });
  it('should not rename a node to a name that already exists', () => {
    expect(() => {
      const before = { name: 'fileB', type: 'file', parent: 'root' };
      const after = { name: 'fileA', type: 'file', parent: 'root' };
      fileSystem.add({ name: 'fileA', type: 'file', parent: 'root' });
      fileSystem.add({ name: 'fileB', type: 'file', parent: 'root' });
      fileSystem.rename(before, after);
    }).toThrow();
  });
});

describe('fileSystem.traverse', () => {
  it('should return the destination node', () => {
    fileSystem.add({ name: 'dir1', type: 'directory', parent: 'root' });
    fileSystem.add({ name: 'dir2', type: 'directory', parent: 'dir1' });
    expect(fileSystem.traverse('dir2')).toEqual({
      name: 'dir2',
      type: 'directory',
      parent: 'dir1',
      children: [],
    });
  });
});

afterEach(() => {
  fileSystem = undefined;
});
