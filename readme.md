# Markdown API

An Express RESTful API that performs CRUD actions against a MongoDB data store for text content, such as markdown or HTML, for applications such as a blog.

This project is the server-side companion to [johnfoderaro/markdown-editor](https://github.com/johnfoderaro/markdown-editor), but it can be used on its own for any other projects that follow and or benefit from its schema.

## Requirements
- Node 10.x
- MongoDB 4.x

## Getting Started

- Clone the respository
- `npm i` to install depedencies.
- `npm start` to run local Express server and connect to MongoDB
- `npm test` to run Jest tests

`./index.js` is where the address for MongoDB connections via Mongoose can be configured, as well as the port number for Express.

## Routes

### `/filesystem/`

The `/filesystem/` route has several endpoints for getting, inserting, removing, and renaming a single MongoDB document that represents a file system tree with nodes that have the following attributes:

- `id`
- `name`
- `type`
- `parent`
- `children`

For example, upon initalizing this application, a tree is created or retrieved from MongoDB, with the following node as its root:

```javascript
{
  id: null,
  name: 'root',
  type: 'dir',
  parent: null,
  children: [],
}
```

This tree persists as a data model in its respective document in MongoDB and also within the instance of `FileSystemController` as `this.tree`.

All subsequent nodes require a `parent` and only nodes that are the `type: 'dir'` can have an `id: null` -- as these types of nodes are not actual documents in MongoDB, whereas a `type: 'file'` is a reference to an actual MongoDB document that represents a file and the `id` *must* be a MongoDB `ObjectId` string.

#### `/filesystem/get/`

HTTP GET request that returns a JSON response containing the file system tree retreived from the root MongoDB document. If no tree or root node is found, one is created under the collection "markdown-api filesystem" (this can be configured via the Mongoose fileSystemSchema within `./model/`). There are no parameters for this endpoint.

##### Example response

```json
{
  "id": null,
  "name": "root",
  "type": "dir",
  "parent": null,
  "children": [
    {
      "id": null,
      "name": "dirA",
      "type": "dir",
      "parent": "root",
      "children": [
        {
          "id": "5be246789927a27d9c83628f",
          "name": "file01",
          "type": "file",
          "parent": "dirA",
          "children": []
        }
      ]
    }
  ]
}
```

#### `/filesystem/insert/`

HTTP POST request that returns a 200 status code upon successfully inserting a node into the file system tree, or a 500 status code upon unsuccessful updating where `updateOne` in MongoDB returns `{ nModified: 0 }`. The request format is JSON and must contain the following parameters:

- id
- name
- type
- parent
- children

###### `id`
`id` can be `null` when the `type` is `dir` as these nodes are not representing an actual document within the `markdown-api files` collection in MongoDB. Otherwise, `id` is required and should be a MongoDB `ObjectID` string that references a file document.

###### `name`
String representing the name of the node. Ideally, if a node is a `type` of `file`, the name here should match the `name` of the file document it is in reference to.

###### `type`
String representing the type of the node. Must be either `file` or `dir` respectively.

###### `parent`
String respsending the name of the parent node.

###### `children`
Array of children nodes. For node `type` of `file`, which cannot have children, an empty array must be provided for the sake of consistancy of the node shape throughout the API.

##### Example request

```json
{
  "id": null,
  "name": "dirA",
  "type": "dir",
  "parent": "root",
  "children": []
}
```

##### Example response

200 or 500 HTTP status code.

#### `/filesystem/remove/`

HTTP DELETE request that returns a 200 status code upon successful removal of the node from the file system tree document, or a 500 status code upon unsuccessful removal where `deleteOne` in MongoDB returns `{ n: 0 }`. The request format is JSON and must contain the following parameters:

- name
- parent

##### Example request

```json
{
  "name": "dirA",
  "parent": "root",
}
```

##### Example response

200 or 500 HTTP status code.

#### `/filesystem/rename/`

HTTP PUT request that returns a 200 status code upon successful updating of an existing node from the file system tree document, or a 500 status code upon unsuccessful updating where `updateOne` in MongoDB returns `{ nModified: 0 }`. The request format is JSON and must contain the following parameters:

- name
- parent
- update

##### Example request

```json
{
  "name": "file01",
  "parent": "root",
  "update": {
    "name": "file02"
  }
}
```

##### Example response

200 or 500 HTTP status code.

### `/file/`

The `/file/` route has several endpoints for getting, inserting, removing, and renaming documents within MongoDB:

#### `/file/get/:id/`

HTTP GET request that returns a JSON response containing the data from a file document retrieved from MongoDB or a 404 HTTP status code upon unsuccessful GETs where `findById` in MongoDB returns `null` due to the document not being found. The request must include an `id` parameter containing the MongoDB objectId:

##### Example request

`/get/5be246789927a27d9c83628f`

##### Example response

```json
{
  "name": "file01",
  "data": "contents of file01"
}
```

#### `/file/insert/`

HTTP POST request that returns a JSON response containing the document objectId from MongoDB, once successfully inserted, or a 500 HTTP status code upon unsucessful POSTs where `create` in MongoDB fails. The request format is JSON and must contain the following parameters:

- data
- name

##### Example request

```json
{
  "name": "file01",
  "data": "contents of file01"
}
```

##### Example response

```json
{
  "id": "5bfb198c277d421ce9d8d876"
}
```

#### `/file/remove/`

HTTP DELETE request that returns a 200 status code upon successful removal of the doucment from MongoDB, or a 404 status code upon unsuccessful removal where `deleteOne` in MongoDB returns `{ n: 0 }` due to the document not being found. The request format is JSON and must contain the following parameters:

- id

##### Example request

```json
{
  "id": "5bfb198c277d421ce9d8d876"
}
```

##### Example response

200 or 500 HTTP status code.

#### `/file/update/`

HTTP PUT request that returns a 200 status code upon successful updating of an existing document form MongoDB where the name and or data is updated. Otherwise, it returns the following when `updateOne` in MongoDB returns:

- `{ n: 1, nModified: 0 }` results in a 400 status code
- `{ n: 0, nModified: 0 }` results in a 404 status code
- none of the above results in a 500 status code

The request format is JSON and must contain the following parameters:

- id
- update
- - name
- - data

##### Example request

```json
{
  "id": "5bfb198c277d421ce9d8d876",
  "update": {
    "name": "file02",
    "data": "file 2 new data
  }
}
```

##### Example response

200, 400, 404, or 500 HTTP status code.




