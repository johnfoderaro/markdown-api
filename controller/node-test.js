function initNodeController(model) {
  let rootNode = null;
  const queue = [];

  function dequeue() {
    return queue.shift();
  }

  function enqueue(item) {
    return queue.push(item);
  }

  function traverse(destination) {
    let current;
    enqueue(rootNode);
    current = dequeue();
    while (current) {
      for (let n = 0; n < current.children.length; n += 1) {
        enqueue(current.children[n]);
      }
      if (current.name === destination) {
        break;
      }
      current = dequeue();
    }
    return current;
  }

  return () => ({
    async insertNode(req, res, next) {
      let current;
      try {
        const { body } = req;
        if (!rootNode) {
          const existingRoot = await model.findOne({ name: 'rootNode', parent: null });
          const createRoot = async () => model.create({
            name: 'root',
            type: 'directory',
            parent: null,
            children: [],
            id: null,
          });
          rootNode = existingRoot || await createRoot();
        }
        current = traverse(body.parent);
        const { _id, children } = current;
        const duplicateChild = children.find(child => child.name === body.name);
        if (duplicateChild) {
          throw new Error('Cannot add duplicate children');
        }
        if (current.type === 'file') {
          throw new Error('Cannot add child to node type of `file`');
        }
        if (!body.parent) {
          throw new Error('Cannot have orphan nodes');
        }
        const { nModified } = await model.updateOne({ _id }, {
          name: current.name,
          parent: current.parent,
          type: current.type,
          id: current.id,
          children: [{
            name: body.name,
            type: body.type,
            parent: body.parent,
            id: body.id,
          }, ...children],
        });
        return nModified ? res.sendStatus(200) : res.sendStatus(500);
      } catch (error) {
        return next(error);
      }
    },
  });
}

module.exports = initNodeController;
