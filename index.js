const ObjectId = require('mongoose').Types.ObjectId;
const items = require('ngn-grid-items');
const ucFirst = function (str) {
  const f = str.charAt(0).toUpperCase();
  return f + str.substr(1, str.length - 1);
};

module.exports = function (name, model, opt) {
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
          {},
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
      request.db[modelName].create(request.payload, () => {
        reply({success: 1});
      });
    }
  };
  const updateRoute = {
    method: 'POST',
    path: opt.apiBase + name + '/{id}',
    handler: (request, reply) => {
      console.log('>>>> ' + ObjectId(request.params.id));
      request.db[modelName].update({
        _id: ObjectId(request.params.id)
      }, {
        $set: request.payload
      }, (err, r) => {
        reply(r);
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
