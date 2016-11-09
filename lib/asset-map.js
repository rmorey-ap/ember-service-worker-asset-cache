var Filter = require('broccoli-filter');
var fs = require('fs');
var path = require('path');

// Create a subclass AssetMap derived from Filter
AssetMap.prototype = Object.create(Filter.prototype);
AssetMap.prototype.constructor = AssetMap;
function AssetMap(inputNodes, options) {
  if (!(this instanceof AssetMap)) {
    return new AssetMap(inputNodes, options);
  }

  options = options || {};

  Filter.call(this, inputNodes, {
    annotation: options.annotation
  });

  this.options = options;
}

AssetMap.prototype.getDestFilePath = function() {
  return false;
};

AssetMap.prototype.writeAssetMap = function() {
  var filePaths = [];
  var exclude = this.options.exclude;
  var include = this.options.include;

  this.inputPaths.forEach(function(path) {
    filePaths = filePaths.concat(walkSync(path, null, null, exclude));
  });

  if (include) {
    filePaths = filePaths.concat(include);
  }

  var data = { files: filePaths };
  if (this.options && this.options.prepend) {
    data.prepend = this.options.prepend;
  }

  safeWrite(path.join(this.outputPath, 'files.json'), JSON.stringify(data));
};

AssetMap.prototype.build = function() {
  var self = this;

  return Filter.prototype.build.call(this).then(function() {
    self.writeAssetMap();
  });
};

var walkSync = function(baseDir, dir, filelist, exclude) {
  var fullDir = dir ? path.join(baseDir, dir): baseDir;
  var files = fs.readdirSync(fullDir);
  filelist = filelist || [];
  exclude = exclude || [];

  files.filter(function (file) {
    // filter out excluded files
    if (!(exclude.indexOf(file) >= 0)) {
      return file
    }
  }).forEach(function(file) {
    var filePath = (dir ? dir + '/' : '') + file;
    if (fs.statSync(fullDir + '/' + file).isDirectory()) {
      filelist = walkSync(baseDir, filePath, filelist, exclude);
    } else {
      filelist.push(filePath);
    }
  });

  return filelist;
};

var safeWrite = function(file, contents){
  var dir = path.dirname(file);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFileSync(file, contents);
};

module.exports = AssetMap;
