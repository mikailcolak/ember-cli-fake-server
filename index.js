'use strict';
const path = require('path');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');

const lazyLoaded = {};

function lazyLoad(moduleName){
  if (!lazyLoaded[moduleName]) {
    lazyLoaded[moduleName] = require(moduleName);
  }
  return lazyLoaded[moduleName];
}

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

  treeFor() {
    if (this._shouldIncludeFiles()) {
      return this._super.treeFor.apply(this, arguments);
    }
    return this._emptyTree();
  },

  postprocessTree(type, tree) {
    if (type === 'js' && !this._shouldIncludeFiles()) {
      return this._excludeSelf(tree);
    }
    return tree;
  },

  _excludeSelf: function (tree) {
    const modulePrefix = this.app.project.config(this.app.env)['modulePrefix'];
    const Funnel = lazyLoad('broccoli-funnel');
    return new Funnel(tree, {
      exclude: [new RegExp(`^${modulePrefix}/${this.name}/`)],
      description: `Funnel: exclude ${this.name}`
    });
  },

  _emptyTree: function () {
    const mergeTrees = lazyLoad('broccoli-merge-trees');
    return mergeTrees([]);
  },

  _shouldIncludeFiles: function () {
    if (process.env.EMBER_CLI_FASTBOOT) return false;
    return this.app.env !== 'production';
  }
};
