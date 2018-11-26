# Markdown API

An Express RESTful API that performs CRUD actions against a MongoDB data store for text content, such as markdown or HTML, for applications such as a blog.

This project is the server-side companion to [johnfoderaro/markdown-editor](https://github.com/johnfoderaro/markdown-editor), but it can be used on its own for any other projects that follow and or benefit from its schema.

## Getting Started

## Routes

### `/file/`

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

#### `/file/rename/`

HTTP PUT request that returns a 200 status code upon successful updating of an existing document form MongoDB, or a 404 status code upon unsuccessful updating where `updateOne` in MongoDB returns `{ nModified: 0 }` due to the document not being found. The request format is JSON and must contain the following parameters:

- id
- name

##### Example request

```json
{
  "id": "5bfb198c277d421ce9d8d876",
  "name": "file02",
}
```

##### Example response

```json
{
  "id": "5bfb198c277d421ce9d8d876",
  "name": "file02",
  "data": "contents of file01"
}
```

### /filesystem
