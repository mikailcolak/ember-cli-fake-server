'use strict';
const path = require('path');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const addonName = require('./package').name;

module.exports = {
  name: addonName,

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

  treeForVendor(tree) {

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
      annotation: `${addonName}: treeForVendor`
    });
  },

  included(app) {
    const opts = app.options.pretender || { enabled: app.tests };
    if (opts.enabled) {
      this._findPretenderPaths();

      app.import(this._fakeRequestPath);
      app.import(this._routeRecognizerPath);
      app.import(this._pretenderPath);
    }
  },

  treeFor(/*type*/) {
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

  _excludeSelf(tree) {
    const modulePrefix = this?.app?.modulePrefix;
    if (!modulePrefix) return tree;

    return new Funnel(tree, {
      exclude: [new RegExp(`^${modulePrefix}/${addonName}/`)],
      description: `Funnel: exclude ${addonName}`
    });
  },

  _emptyTree() {
    return new MergeTrees([]);
  },

  _shouldIncludeFiles() {
    if (process.env.EMBER_CLI_FASTBOOT) return false;
    return this?.app?.env === 'test';
  },
};
