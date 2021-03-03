'use strict';
const path = require('path');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: require('./package').name,

  _findPretenderPaths() {
    if (!this._pretenderPath) {
      this._pretenderPath = require.resolve('pretender');
      this._pretenderDir = path.dirname(this._pretenderPath);
      this._routeRecognizerPath = require.resolve('route-recognizer');
      this._fakeRequestPath = require.resolve('fake-xml-http-request');
    }
  },

  init(...args) {
    this._super.init.apply(this, args);
    this._findPretenderPaths();
  },

  treeForVendor: function (tree) {

    const pretenderTree = new Funnel(this._pretenderDir, {
      files: [path.basename(this._pretenderPath)],
      destDir: '/pretender',
    });

    const routeRecognizerFilename = path.basename(this._routeRecognizerPath);
    const routeRecognizerTree = new Funnel(path.dirname(this._routeRecognizerPath), {
      files: [routeRecognizerFilename, routeRecognizerFilename + '.map'],
      destDir: '/route-recognizer',
    });

    const fakeRequestTree = new Funnel(path.dirname(this._fakeRequestPath), {
      files: [path.basename(this._fakeRequestPath)],
      destDir: '/fake-xml-http-request',
    });

    const trees = [
      tree,
      pretenderTree,
      routeRecognizerTree,
      fakeRequestTree,
    ].filter(Boolean);

    return new MergeTrees(trees, {
      annotation: 'ember-cli-pretender: treeForVendor'
    });
  },

  included(app) {
    const opts = app.options.pretender || { enabled: app.tests };
    if (opts.enabled) {
      this._findPretenderPaths();

      app.import('vendor/fake-xml-http-request/' + path.basename(this._fakeRequestPath));
      app.import('vendor/route-recognizer/' + path.basename(this._routeRecognizerPath));
      app.import('vendor/pretender/' + path.basename(this._pretenderPath));
    }
  },

};
