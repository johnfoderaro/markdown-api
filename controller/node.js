class NodeController {
  constructor(model) {
    this.queue = [];
    this.root = null;
    this.model = model;
  }

  dequeue() {
    return this.queue.shift();
  }

  enqueue(item) {
    this.queue.push(item);
  }

  async insertNode(req, res, next) {
    let current;
    try {
      const {
        body: {
          name,
          type,
          parent,
          id,
        },
      } = req;
      const rootNode = await this.model.findOne({ name: 'root', parent: null });
      if (!rootNode) {
        this.root = await this.model.addFile({
          name: 'root',
          type: 'directory',
          parent: null,
          children: [],
          id: null,
        });
      } else {
        this.root = rootNode;
        current = this.traverse(parent);
        const { _id, children } = current;
        const duplicateChild = children.find(child => child.name === name);
        if (duplicateChild) {
          throw new Error('Cannot add duplicate children');
        }
        if (current.type === 'file') {
          throw new Error('Cannot add child to node type of `file`');
        }
        const update = await this.model.updateOne({ _id }, {
          name: current.name,
          parent: current.parent,
          type: current.type,
          id: current.id,
          children: [{
            name,
            type,
            parent,
            id,
          }, ...children],
        });
        return res(update);
      }
    } catch (error) {
      return next(error);
    }
    return false;
  }

  // async deleteNode(req, res, next) {

  // }

  // async getNode(req, res, next) {

  // }

  // async getTree(req, res, next) {

  // }

  // async renameNode(req, res, next) {

  // }

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

module.exports = NodeController;
