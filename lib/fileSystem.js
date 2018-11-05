class FileSystem {
  constructor() {
    this.queue = [];
    this.root = FileSystem.node({
      name: 'root',
      type: 'directory',
    });
  }

  static node({
    name,
    type,
    parent = null,
    children = [],
  }) {
    return {
      name,
      type,
      parent,
      children,
    };
  }

  add({ name, type, parent }) {
    const current = this.traverse(parent);
    const { children } = current;
    const match = children.find(child => child.name === name);
    if (match) {
      throw new Error('Cannot add duplicate children');
    }
    if (current.type === 'file') {
      throw new Error('Cannot add child to node type of `file`');
    }
    children.push(FileSystem.node({ name, type, parent }));
  }

  del({ name, parent }) {
    const { children } = this.traverse(parent);
    const index = children.map(child => child.name).indexOf(name);
    children.splice(index, 1);
  }

  dequeue() {
    return this.queue.shift();
  }

  enqueue(item) {
    this.queue.push(item);
  }

  rename(before, after) {
    let { children } = this.traverse(before.parent);
    const match = children.find(child => child.name === after.name);
    if (match) {
      throw new Error(`${after.name} already exists`);
    }
    children = children.map((child) => {
      if (child.name === before.name) {
        // FIXME eslint isn't happy about this re-assignment
        child.name = after.name;
      }
      return child;
    });
  }

  traverse(destination) {
    let current;
    this.enqueue(this.root);
    current = this.dequeue();
    while (current) {
      for (let n = 0; n < current.children.length; n += 1) {
        this.enqueue(current.children[n]);
      }
      if (current.name === destination) {
        break;
      }
      current = this.dequeue();
    }
    return current;
  }
}

module.exports = FileSystem;
