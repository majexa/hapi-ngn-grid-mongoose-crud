const ObjectId = require('mongoose').Types.ObjectId;
const items = require('ngn-grid-items');
const ucFirst = function (str) {
  const f = str.charAt(0).toUpperCase();
  return f + str.substr(1, str.length - 1);
};

module.exports = function (name, model, opt) {
  const ownerFieldName = name + 's';
  const modelName = ucFirst(name);
  if (!opt) opt = {};
  if (!opt.apiBase) opt.apiBase = '/api/v1/';
  const listRoutes = function (name, model) {
    let path = opt.apiBase + name + 's';
    if (opt.extendPath) path += opt.extendPath
    const r = {
      method: 'GET',
      handler: (request, reply) => {
        if (!request.db[modelName]) {
          throw new Error('Model "' + modelName + '" is not in existing: ' + Object.keys(request.db));
        }
        items(
          opt.filter || {},
          request.params.pg || 1,
          path,
          request.db[modelName],
          model,
          {_id: 'id'},
          (data) => {
            reply(data);
          }
        );
      }
    };
    routes = [];
    routes.push(Object.assign({path: path}, r));
    routes.push(Object.assign({path: path + '/pg{pg}'}, r));
    return routes;
  };
  const readRoute = {
    method: 'GET',
    path: opt.apiBase + name + '/{id}',
    handler: (request, reply) => {
      request.db[modelName].findOne({
        _id: ObjectId(request.params.id)
      }, (err, r) => {
        reply(r);
      });
    }
  };
  const createRoute = {
    method: 'POST',
    path: opt.apiBase + name,
    handler: (request, reply) => {
      request.db[modelName].create(request.payload, (err, createdModel) => {
        if (err) throw new Error(err);
        const paths = request.db[modelName].schema.paths;
        let v;
        for (let mongoPath in paths) {
          v = paths[mongoPath];
          if (v.options && v.options.ref) {
            let ownerCollection = v.options.ref;
            let ownerIdName = v.path;
            request.db[ownerCollection].findOne({
              _id: request.payload[ownerIdName]
            }, function(err, ownerModel) {
              if (err) console.error(err);
              ownerModel[ownerFieldName].push(createdModel);
              ownerModel.save(function(err) {
                if (err) console.error(err);
              })
            });
          }
        }
        opt.onCreate ? opt.onCreate(request, reply, createdModel) : reply(createdModel);
      });
    }
  };
  const updateRoute = {
    method: 'POST',
    path: opt.apiBase + name + '/{id}',
    handler: (request, reply) => {
      let user = {_id: request.params.id};
      user = Object.assign(user, request.payload);
      request.db[modelName].update({
        _id: ObjectId(request.params.id)
      }, {
        $set: request.payload
      }, (err, r) => {
        opt.onUpdate ? opt.onUpdate(request, reply, user, r) : reply(r);
      });
    }
  };
  const deleteRoute = {
    method: 'GET',
    path: opt.apiBase + name + '/{id}/delete',
    handler: (request, reply) => {
      request.db[ucFirst(name)].findOne({
        _id: ObjectId(request.params.id)
      }).remove().exec((err, r) => {
        reply({success: 1});
      });
    }
  };
  return [
    createRoute,
    updateRoute,
    readRoute,
    deleteRoute
  ].concat(listRoutes(name, model));
};
